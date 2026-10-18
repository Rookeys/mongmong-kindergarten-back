import { ErrorCode } from '../../common/error-code';
import { DataSource } from 'typeorm';
import { toKstDateString } from '../../common/utils/to-kst-date-string.util';
import { QuestionService } from '../question/question.service';
import {
  INVITE_REWARD_AMOUNT,
  LETTER_REWARD_AMOUNT,
  PAST_LETTER_COST,
  STREAK_REWARD_AMOUNT,
} from '../reward/constants/reward-amount.constants';
import { RewardHistory } from '../reward/entities/reward-history.entity';
import { RewardType } from '../reward/enums/reward-type.enum';
import { RewardService } from '../reward/reward.service';
import { User } from '../user/entities/user.entity';
import { UserInvite } from '../user/entities/user-invite.entity';
import { Letter } from './entities/letter.entity';
import { LetterService } from './letter.service';

type FakeUser = Pick<User, 'id' | 'questionSeriesId' | 'rewardCount'>;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TODAY = toKstDateString();
const YESTERDAY = toKstDateString(new Date(Date.now() - MS_PER_DAY));
const TOMORROW = toKstDateString(new Date(Date.now() + MS_PER_DAY));

/**
 * dataSource.transaction(cb)이 넘겨주는 EntityManager를 흉내내는 간이 mock.
 * 저장소별 인메모리 상태를 엔티티 클래스 참조로 분기해 조회/저장을 처리한다.
 */
function createManagerMock(state: {
  users: Map<string, FakeUser>;
  /** 이미 일지가 있는 날짜 */
  letterDates?: string[];
  /** 직전 4일 동안 쓴 일지 수 */
  previousStreakLetterCount?: number;
  hasRecentStreakReward?: boolean;
  pendingInvite?: UserInvite;
}) {
  const savedRewardHistories: Partial<RewardHistory>[] = [];
  const savedLetters: Partial<Letter>[] = [];
  const letterDates = state.letterDates ?? [];

  const manager = {
    findOneBy: jest.fn((entity: unknown, where: Record<string, unknown>) => {
      if (entity === User) {
        return state.users.get(where.id as string) ?? null;
      }
      if (entity === Letter) {
        return letterDates.includes(where.letterDate as string)
          ? { id: 'existing' }
          : null;
      }
      if (entity === UserInvite) {
        if (
          state.pendingInvite &&
          state.pendingInvite.inviteeUserId === where.inviteeUserId &&
          state.pendingInvite.rewardGivenYn === where.rewardGivenYn
        ) {
          return state.pendingInvite;
        }
        return null;
      }
      throw new Error(`unexpected findOneBy entity: ${String(entity)}`);
    }),
    findOne: jest.fn(
      (entity: unknown, options: { where: Record<string, unknown> }) => {
        if (entity === User) {
          return state.users.get(options.where.id as string) ?? null;
        }
        if (entity === RewardHistory) {
          return state.hasRecentStreakReward ? { id: 'streak' } : null;
        }
        throw new Error(`unexpected findOne entity: ${String(entity)}`);
      },
    ),
    count: jest.fn(
      (entity: unknown, options: { where: Record<string, unknown> }) => {
        if (entity === Letter) {
          return options.where.letterDate
            ? (state.previousStreakLetterCount ?? 0)
            : letterDates.length;
        }
        throw new Error(`unexpected count entity: ${String(entity)}`);
      },
    ),
    save: jest.fn((entity: unknown, payload: unknown) => {
      if (entity === Letter) {
        savedLetters.push(payload as Partial<Letter>);
        return { id: 'letter-1', ...(payload as object) };
      }
      if (entity === User) {
        const user = payload as FakeUser;
        state.users.set(user.id, user);
        return user;
      }
      if (entity === RewardHistory) {
        const rows = Array.isArray(payload) ? payload : [payload];
        savedRewardHistories.push(...(rows as Partial<RewardHistory>[]));
        return payload;
      }
      if (entity === UserInvite) {
        return payload;
      }
      throw new Error(`unexpected save entity: ${String(entity)}`);
    }),
  };

  return { manager, savedRewardHistories, savedLetters };
}

function buildService(managerMock: ReturnType<typeof createManagerMock>) {
  const dataSource = {
    transaction: jest.fn((cb: (manager: unknown) => unknown) =>
      cb(managerMock.manager),
    ),
  } as unknown as DataSource;
  const questionService = {
    findByDate: jest.fn((_seriesId: string | null, date: string) => ({
      id: `q-${date}`,
    })),
  } as unknown as QuestionService;
  const emptyRepository = {} as never;
  return new LetterService(
    emptyRepository,
    emptyRepository,
    emptyRepository,
    emptyRepository,
    dataSource,
    questionService,
    new RewardService(emptyRepository, dataSource),
  );
}

function buildUser(rewardCount = 0): FakeUser {
  return { id: 'u1', questionSeriesId: 's1', rewardCount };
}

describe('LetterService.create', () => {
  it('오늘 일지는 날짜의 질문으로 저장하고 작성 리워드를 적립한다', async () => {
    const user = buildUser();
    const managerMock = createManagerMock({
      users: new Map([['u1', user]]),
      letterDates: [YESTERDAY],
    });

    const result = await buildService(managerMock).create('u1', {
      answer: '오늘의 답',
    });

    expect(result.letterDate).toBe(TODAY);
    expect(result.rewardAmount).toBe(LETTER_REWARD_AMOUNT);
    expect(managerMock.savedLetters[0]).toMatchObject({
      isPrivate: true,
      isPrivateSns: true,
    });
    expect(result.questionId).toBe(`q-${TODAY}`);
    expect(user.rewardCount).toBe(LETTER_REWARD_AMOUNT);
    expect(managerMock.savedRewardHistories).toEqual([
      { userId: 'u1', type: RewardType.LETTER, amount: LETTER_REWARD_AMOUNT },
    ]);
  });

  it('같은 날짜에 이미 일지가 있으면 실패한다', async () => {
    const managerMock = createManagerMock({
      users: new Map([['u1', buildUser()]]),
      letterDates: [TODAY],
    });

    await expect(
      buildService(managerMock).create('u1', { answer: '또 쓰기' }),
    ).rejects.toMatchObject({ code: ErrorCode.LETTER_ALREADY_EXISTS });
    expect(managerMock.savedLetters).toHaveLength(0);
  });

  it('미래 날짜에는 쓸 수 없다', async () => {
    const managerMock = createManagerMock({
      users: new Map([['u1', buildUser()]]),
    });

    await expect(
      buildService(managerMock).create('u1', {
        answer: '내일의 답',
        letterDate: TOMORROW,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DATE_IN_FUTURE });
  });

  it('지난 날짜 일지는 리워드를 차감하고 작성 리워드는 주지 않는다', async () => {
    const user = buildUser(PAST_LETTER_COST);
    const managerMock = createManagerMock({
      users: new Map([['u1', user]]),
      letterDates: [TODAY],
    });

    const result = await buildService(managerMock).create('u1', {
      answer: '어제의 답',
      letterDate: YESTERDAY,
    });

    expect(result.letterDate).toBe(YESTERDAY);
    expect(result.rewardAmount).toBe(-PAST_LETTER_COST);
    expect(user.rewardCount).toBe(0);
    expect(managerMock.savedRewardHistories).toEqual([
      {
        userId: 'u1',
        type: RewardType.PAST_LETTER,
        amount: -PAST_LETTER_COST,
      },
    ]);
  });

  it('지난 날짜 일지를 쓸 리워드가 모자라면 실패하고 저장하지 않는다', async () => {
    const user = buildUser(PAST_LETTER_COST - 1);
    const managerMock = createManagerMock({
      users: new Map([['u1', user]]),
      letterDates: [TODAY],
    });

    await expect(
      buildService(managerMock).create('u1', {
        answer: '어제의 답',
        letterDate: YESTERDAY,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.REWARD_INSUFFICIENT });
    expect(user.rewardCount).toBe(PAST_LETTER_COST - 1);
    expect(managerMock.savedLetters).toHaveLength(0);
  });

  it('직전 4일을 모두 썼으면 오늘 일지로 연속 작성 보상을 받는다', async () => {
    const user = buildUser();
    const managerMock = createManagerMock({
      users: new Map([['u1', user]]),
      letterDates: [YESTERDAY],
      previousStreakLetterCount: 4,
    });

    await buildService(managerMock).create('u1', { answer: '5일째' });

    expect(user.rewardCount).toBe(LETTER_REWARD_AMOUNT + STREAK_REWARD_AMOUNT);
    expect(managerMock.savedRewardHistories).toContainEqual({
      userId: 'u1',
      type: RewardType.STREAK,
      amount: STREAK_REWARD_AMOUNT,
    });
  });

  it('최근 4일 안에 연속 보상을 받았으면 다시 주지 않는다', async () => {
    const user = buildUser();
    const managerMock = createManagerMock({
      users: new Map([['u1', user]]),
      letterDates: [YESTERDAY],
      previousStreakLetterCount: 4,
      hasRecentStreakReward: true,
    });

    await buildService(managerMock).create('u1', { answer: '6일째' });

    expect(user.rewardCount).toBe(LETTER_REWARD_AMOUNT);
  });

  it('직전 4일 중 빠진 날이 있으면 연속 보상이 없다', async () => {
    const user = buildUser();
    const managerMock = createManagerMock({
      users: new Map([['u1', user]]),
      letterDates: [YESTERDAY],
      previousStreakLetterCount: 3,
    });

    await buildService(managerMock).create('u1', { answer: '끊긴 연속' });

    expect(user.rewardCount).toBe(LETTER_REWARD_AMOUNT);
  });

  it('첫 일지이고 대기 중인 초대가 있으면 초대자/피초대자 모두에게 리워드를 지급한다', async () => {
    const invitee = buildUser();
    const inviter: FakeUser = {
      id: 'u2',
      questionSeriesId: 's1',
      rewardCount: 0,
    };
    const pendingInvite = {
      inviterUserId: 'u2',
      inviteeUserId: 'u1',
      rewardGivenYn: false,
    } as UserInvite;
    const managerMock = createManagerMock({
      users: new Map([
        ['u1', invitee],
        ['u2', inviter],
      ]),
      pendingInvite,
    });

    await buildService(managerMock).create('u1', { answer: '첫 일지' });

    expect(invitee.rewardCount).toBe(
      LETTER_REWARD_AMOUNT + INVITE_REWARD_AMOUNT,
    );
    expect(inviter.rewardCount).toBe(INVITE_REWARD_AMOUNT);
    expect(pendingInvite.rewardGivenYn).toBe(true);
  });
});
