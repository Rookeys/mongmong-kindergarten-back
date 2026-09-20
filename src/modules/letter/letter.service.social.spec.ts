import { ErrorCode } from '../../common/error-code';
import { LetterReactionType } from './enums/letter-reaction-type.enum';
import { LetterReportReasonType } from './enums/letter-report-reason-type.enum';
import { LetterReportStatus } from './enums/letter-report-status.enum';
import { LetterService } from './letter.service';

type RepoMock = {
  findOneBy: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
};

function createRepoMock(): RepoMock {
  return { findOneBy: jest.fn(), save: jest.fn(), find: jest.fn() };
}

function buildService(repos: {
  letter: RepoMock;
  aiReply?: RepoMock;
  reaction?: RepoMock;
  report?: RepoMock;
}) {
  return new LetterService(
    repos.letter as never,
    (repos.aiReply ?? createRepoMock()) as never,
    (repos.reaction ?? createRepoMock()) as never,
    (repos.report ?? createRepoMock()) as never,
    {} as never,
  );
}

describe('LetterService.addReaction', () => {
  it('비공개가 아닌 타인의 편지에 처음 반응하면 새로 생성한다', async () => {
    const letterRepo = createRepoMock();
    const reactionRepo = createRepoMock();
    letterRepo.findOneBy.mockResolvedValue({
      id: 'l1',
      userId: 'owner',
      isPrivate: false,
    });
    reactionRepo.findOneBy.mockResolvedValue(null);
    reactionRepo.save.mockImplementation((payload) => ({
      id: 'r1',
      createdDate: new Date(),
      ...payload,
    }));
    const service = buildService({
      letter: letterRepo,
      reaction: reactionRepo,
    });

    const result = await service.addReaction('viewer', 'l1', {
      reactionType: LetterReactionType.LIKE,
    });

    expect(result.reactionType).toBe(LetterReactionType.LIKE);
    expect(reactionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ letterId: 'l1', userId: 'viewer' }),
    );
  });

  it('이미 반응한 경우 새로 만들지 않고 반응 유형을 갱신한다', async () => {
    const letterRepo = createRepoMock();
    const reactionRepo = createRepoMock();
    letterRepo.findOneBy.mockResolvedValue({
      id: 'l1',
      userId: 'owner',
      isPrivate: false,
    });
    const existing = {
      id: 'r1',
      letterId: 'l1',
      userId: 'viewer',
      reactionType: LetterReactionType.LIKE,
      createdDate: new Date(),
    };
    reactionRepo.findOneBy.mockResolvedValue(existing);
    reactionRepo.save.mockImplementation((payload) => payload);
    const service = buildService({
      letter: letterRepo,
      reaction: reactionRepo,
    });

    const result = await service.addReaction('viewer', 'l1', {
      reactionType: LetterReactionType.CHEER,
    });

    expect(result.reactionType).toBe(LetterReactionType.CHEER);
    expect(reactionRepo.save).toHaveBeenCalledTimes(1);
    expect(reactionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'r1',
        reactionType: LetterReactionType.CHEER,
      }),
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
