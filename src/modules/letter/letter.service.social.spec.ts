import { ErrorCode } from '../../common/error-code';
import { LetterReactionType } from './enums/letter-reaction-type.enum';
import { LetterReportReasonType } from './enums/letter-report-reason-type.enum';
import { LetterReportStatus } from './enums/letter-report-status.enum';
import { LetterService } from './letter.service';

type RepoMock = {
  findOneBy: jest.Mock;
  findOneByOrFail: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  upsert: jest.Mock;
};

function createRepoMock(): RepoMock {
  return {
    findOneBy: jest.fn(),
    findOneByOrFail: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    upsert: jest.fn(),
  };
}

function buildService(repos: {
  letter: RepoMock;
  aiReply?: RepoMock;
  reaction?: RepoMock;
  report?: RepoMock;
  setting?: { update: jest.Mock };
}) {
  const dataSource = {
    getRepository: () => repos.setting ?? { update: jest.fn() },
  };
  return new LetterService(
    repos.letter as never,
    (repos.aiReply ?? createRepoMock()) as never,
    (repos.reaction ?? createRepoMock()) as never,
    (repos.report ?? createRepoMock()) as never,
    dataSource as never,
    {} as never,
    {} as never,
  );
}

describe('LetterService.addReaction', () => {
  it('비공개가 아닌 타인의 편지에 반응하면 (편지, 사용자) 기준으로 upsert한다', async () => {
    const letterRepo = createRepoMock();
    const reactionRepo = createRepoMock();
    letterRepo.findOneBy.mockResolvedValue({
      id: 'l1',
      userId: 'owner',
      isPrivate: false,
    });
    reactionRepo.findOneByOrFail.mockResolvedValue({
      id: 'r1',
      letterId: 'l1',
      userId: 'viewer',
      reactionType: LetterReactionType.CHEER,
      createdDate: new Date(),
    });
    const service = buildService({
      letter: letterRepo,
      reaction: reactionRepo,
    });

    const result = await service.addReaction('viewer', 'l1', {
      reactionType: LetterReactionType.CHEER,
    });

    expect(result.reactionType).toBe(LetterReactionType.CHEER);
    expect(reactionRepo.upsert).toHaveBeenCalledWith(
      {
        letterId: 'l1',
        userId: 'viewer',
        reactionType: LetterReactionType.CHEER,
      },
      ['letterId', 'userId'],
    );
  });

  it('비공개 편지는 소유자가 아니면 찾을 수 없다', async () => {
    const letterRepo = createRepoMock();
    letterRepo.findOneBy.mockResolvedValue({
      id: 'l1',
      userId: 'owner',
      isPrivate: true,
    });
    const service = buildService({ letter: letterRepo });

    await expect(
      service.addReaction('viewer', 'l1', {
        reactionType: LetterReactionType.LIKE,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.LETTER_NOT_FOUND });
  });
});

describe('LetterService.addReport', () => {
  it('본인 일지는 신고할 수 없다', async () => {
    const letterRepo = createRepoMock();
    letterRepo.findOneBy.mockImplementation((where: Record<string, unknown>) =>
      'userId' in where && where.userId === 'owner'
        ? { id: 'l1', userId: 'owner', isPrivate: false }
        : null,
    );
    const service = buildService({ letter: letterRepo });

    await expect(
      service.addReport('owner', 'l1', {
        reasonType: LetterReportReasonType.SPAM,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.LETTER_REPORT_OWN_LETTER });
  });

  it('타인의 공개 일지는 신고 접수된다', async () => {
    const letterRepo = createRepoMock();
    const reportRepo = createRepoMock();
    letterRepo.findOneBy.mockImplementation(
      (where: Record<string, unknown>) => {
        if ('userId' in where) {
          return where.userId === 'owner'
            ? { id: 'l1', userId: 'owner', isPrivate: false }
            : null;
        }
        return { id: 'l1', userId: 'owner', isPrivate: false };
      },
    );
    reportRepo.save.mockImplementation((payload) => ({
      id: 'rp1',
      createdDate: new Date(),
      ...payload,
    }));
    const service = buildService({ letter: letterRepo, report: reportRepo });

    const result = await service.addReport('viewer', 'l1', {
      reasonType: LetterReportReasonType.SPAM,
    });

    expect(result.status).toBe(LetterReportStatus.PENDING);
    expect(reportRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ reporterUserId: 'viewer', letterId: 'l1' }),
    );
  });
});

describe('LetterService.markAiReplyAsRead', () => {
  it('본인 소유가 아니면 찾을 수 없다', async () => {
    const letterRepo = createRepoMock();
    const aiReplyRepo = createRepoMock();
    aiReplyRepo.findOneBy.mockResolvedValue(null);
    const service = buildService({ letter: letterRepo, aiReply: aiReplyRepo });

    await expect(service.markAiReplyAsRead('u1', 'ai1')).rejects.toMatchObject({
      code: ErrorCode.AI_REPLY_NOT_FOUND,
    });
  });

  it('읽지 않은 답장을 읽음 처리한다', async () => {
    const letterRepo = createRepoMock();
    const aiReplyRepo = createRepoMock();
    const aiReply = {
      id: 'ai1',
      letterId: 'l1',
      userId: 'u1',
      content: '잘했어요',
      isRead: false,
      createdDate: new Date(),
    };
    aiReplyRepo.findOneBy.mockResolvedValue(aiReply);
    aiReplyRepo.save.mockImplementation((payload) => payload);
    const service = buildService({ letter: letterRepo, aiReply: aiReplyRepo });

    const result = await service.markAiReplyAsRead('u1', 'ai1');

    expect(result.isRead).toBe(true);
    expect(aiReplyRepo.save).toHaveBeenCalledTimes(1);
  });
});

describe('LetterService.update', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  function buildLetter(createdDate: Date) {
    return {
      id: 'l1',
      userId: 'owner',
      answer: '원래 내용',
      moodNumber: null,
      isPrivate: true,
      isPrivateSns: true,
      createdDate,
    };
  }

  it('작성 당일에는 본문을 수정할 수 있다', async () => {
    const letterRepo = createRepoMock();
    letterRepo.findOneBy.mockResolvedValue(buildLetter(new Date()));
    letterRepo.save.mockImplementation((payload) => payload);
    const service = buildService({ letter: letterRepo });

    const result = await service.update('owner', 'l1', { answer: '고친 내용' });

    expect(result.answer).toBe('고친 내용');
    expect(result.isPrivate).toBe(true);
  });

  it('작성 다음 날부터는 본문을 수정할 수 없다', async () => {
    const letterRepo = createRepoMock();
    letterRepo.findOneBy.mockResolvedValue(
      buildLetter(new Date(Date.now() - DAY_MS)),
    );
    const service = buildService({ letter: letterRepo });

    await expect(
      service.update('owner', 'l1', { answer: '고친 내용' }),
    ).rejects.toMatchObject({ code: ErrorCode.LETTER_EDIT_EXPIRED });
    expect(letterRepo.save).not.toHaveBeenCalled();
  });

  it('공개 여부는 날짜가 지나도 바꿀 수 있고 본문은 그대로다', async () => {
    const letterRepo = createRepoMock();
    letterRepo.findOneBy.mockResolvedValue(
      buildLetter(new Date(Date.now() - DAY_MS)),
    );
    letterRepo.save.mockImplementation((payload) => payload);
    const settingRepo = { update: jest.fn() };
    const service = buildService({ letter: letterRepo, setting: settingRepo });

    const result = await service.update('owner', 'l1', { isPrivate: false });

    expect(result.isPrivate).toBe(false);
    expect(result.answer).toBe('원래 내용');
    expect(settingRepo.update).toHaveBeenCalledWith(
      { userId: 'owner' },
      { setLetterIsPrivate: false },
    );
  });

  it('본문만 고치면 내 설정은 바꾸지 않는다', async () => {
    const letterRepo = createRepoMock();
    letterRepo.findOneBy.mockResolvedValue(buildLetter(new Date()));
    letterRepo.save.mockImplementation((payload) => payload);
    const settingRepo = { update: jest.fn() };
    const service = buildService({ letter: letterRepo, setting: settingRepo });

    await service.update('owner', 'l1', { answer: '고친 내용' });

    expect(settingRepo.update).not.toHaveBeenCalled();
  });

  it('남의 일지는 찾을 수 없다', async () => {
    const letterRepo = createRepoMock();
    letterRepo.findOneBy.mockResolvedValue(null);
    const service = buildService({ letter: letterRepo });

    await expect(
      service.update('other', 'l1', { isPrivate: false }),
    ).rejects.toMatchObject({ code: ErrorCode.LETTER_NOT_FOUND });
  });
});

describe('LetterService.findCalendar', () => {
  it('일지가 있는 날짜를 날짜·일지 ID·기분으로 내려준다', async () => {
    const letterRepo = createRepoMock();
    letterRepo.find.mockResolvedValue([
      { id: 'l2', moodNumber: 2, letterDate: '2026-05-05' },
      { id: 'l3', moodNumber: null, letterDate: '2026-05-06' },
    ]);
    const service = buildService({ letter: letterRepo });

    const result = await service.findCalendar('owner', {
      year: 2026,
      month: 5,
    });

    expect(result).toEqual([
      { date: '2026-05-05', letterId: 'l2', moodNumber: 2 },
      { date: '2026-05-06', letterId: 'l3', moodNumber: null },
    ]);
  });
});
