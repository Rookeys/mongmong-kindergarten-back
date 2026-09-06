import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LocaleType } from '../../common/enums/locale-type.enum';
import {
  INVITE_REWARD_AMOUNT,
  LETTER_REWARD_AMOUNT,
} from '../reward/constants/reward-amount.constants';
import { RewardHistory } from '../reward/entities/reward-history.entity';
import { RewardType } from '../reward/enums/reward-type.enum';
import { Question } from '../question/entities/question.entity';
import { User } from '../user/entities/user.entity';
import { UserInvite } from '../user/entities/user-invite.entity';
import { Letter } from './entities/letter.entity';
import { LetterService } from './letter.service';

type FakeUser = Pick<User, 'id' | 'currentQuestionId' | 'rewardCount'>;

/**
 * dataSource.transaction(cb)이 넘겨주는 EntityManager를 흉내내는 간이 mock.
 * 저장소별 인메모리 상태를 엔티티 클래스 참조로 분기해 조회/저장을 처리한다.
 */
function createManagerMock(state: {
  users: Map<string, FakeUser>;
  questions: Map<string, Question>;
  letterCount: number;
  pendingInvite?: UserInvite;
}) {
  const savedRewardHistories: Partial<RewardHistory>[] = [];
  const savedLetters: Partial<Letter>[] = [];

  const manager = {
    findOneBy: jest.fn((entity: unknown, where: Record<string, unknown>) => {
      if (entity === User) {
        return state.users.get(where.id as string) ?? null;
      }
      if (entity === Question) {
        return state.questions.get(where.id as string) ?? null;
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
      (
        entity: unknown,
        options: { where: { orderNum: { value: number } } },
      ) => {
        if (entity === Question) {
          const candidates = Array.from(state.questions.values())
            .filter((q) => q.orderNum > options.where.orderNum.value)
            .sort((a, b) => a.orderNum - b.orderNum);
          return candidates[0] ?? null;
        }
        throw new Error(`unexpected findOne entity: ${String(entity)}`);
      },
    ),
    count: jest.fn((entity: unknown) => {
      if (entity === Letter) {
        return state.letterCount;
      }
      throw new Error(`unexpected count entity: ${String(entity)}`);
    }),
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

describe('LetterService.create', () => {
  const question1: Question = {
    id: 'q1',
    questionSeriesId: 's1',
    orderNum: 1,
  } as Question;
  const question2: Question = {
    id: 'q2',
    questionSeriesId: 's1',
    orderNum: 2,
  } as Question;

  function buildService(managerMock: ReturnType<typeof createManagerMock>) {
    const dataSource = {
      transaction: jest.fn((cb: (manager: unknown) => unknown) =>
        cb(managerMock.manager),
      ),
    } as unknown as DataSource;
    const letterRepository = {} as never;
    return new LetterService(letterRepository, dataSource);
  }

  it('진행 중인 질문을 다음 질문으로 넘기고 작성 리워드를 적립한다', async () => {
    const user: FakeUser = {
      id: 'u1',
      currentQuestionId: 'q1',
      rewardCount: 0,
    };
    const managerMock = createManagerMock({
      users: new Map([['u1', user]]),
      questions: new Map([
        ['q1', question1],
        ['q2', question2],
      ]),
      letterCount: 3,
    });
    const service = buildService(managerMock);

    await service.create('u1', {
      answer: '즐거운 하루였어요',
      localeType: LocaleType.KO,
    });

    expect(user.currentQuestionId).toBe('q2');
    expect(user.rewardCount).toBe(LETTER_REWARD_AMOUNT);
    expect(managerMock.savedRewardHistories).toContainEqual(
      expect.objectContaining({ userId: 'u1', type: RewardType.LETTER }),
    );
  });

  it('시리즈의 마지막 질문이면 currentQuestionId를 null로 비운다', async () => {
    const user: FakeUser = {
      id: 'u1',
      currentQuestionId: 'q2',
      rewardCount: 0,
    };
    const managerMock = createManagerMock({
      users: new Map([['u1', user]]),
      questions: new Map([
        ['q1', question1],
        ['q2', question2],
      ]),
      letterCount: 1,
    });
    const service = buildService(managerMock);

    await service.create('u1', { answer: '마지막 질문 답변' });

    expect(user.currentQuestionId).toBeNull();
  });

  it('오늘의 질문이 없으면 BadRequestException을 던진다', async () => {
    const user: FakeUser = {
      id: 'u1',
      currentQuestionId: null,
      rewardCount: 0,
    };
    const managerMock = createManagerMock({
      users: new Map([['u1', user]]),
      questions: new Map(),
      letterCount: 0,
    });
    const service = buildService(managerMock);

    await expect(
      service.create('u1', { answer: '답변' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('첫 일지 작성이고 대기 중인 초대가 있으면 초대자/피초대자 모두에게 리워드를 지급한다', async () => {
    const invitee: FakeUser = {
      id: 'u2',
      currentQuestionId: 'q1',
      rewardCount: 0,
    };
    const inviter: FakeUser = {
      id: 'u1',
      currentQuestionId: 'q1',
      rewardCount: 0,
    };
    const pendingInvite: UserInvite = {
      id: 'inv1',
      inviterUserId: 'u1',
      inviteeUserId: 'u2',
      inviteCode: 'CODE1',
      rewardGivenYn: false,
    } as UserInvite;

    const managerMock = createManagerMock({
      users: new Map([
        ['u1', inviter],
        ['u2', invitee],
      ]),
      questions: new Map([
        ['q1', question1],
        ['q2', question2],
      ]),
      letterCount: 0,
      pendingInvite,
    });
    const service = buildService(managerMock);

    await service.create('u2', { answer: '첫 일지예요' });

    expect(invitee.rewardCount).toBe(
      LETTER_REWARD_AMOUNT + INVITE_REWARD_AMOUNT,
    );
    expect(inviter.rewardCount).toBe(INVITE_REWARD_AMOUNT);
    expect(pendingInvite.rewardGivenYn).toBe(true);
    expect(managerMock.savedRewardHistories).toContainEqual(
      expect.objectContaining({ userId: 'u1', type: RewardType.INVITE }),
    );
    expect(managerMock.savedRewardHistories).toContainEqual(
      expect.objectContaining({ userId: 'u2', type: RewardType.INVITE }),
    );
  });
});
