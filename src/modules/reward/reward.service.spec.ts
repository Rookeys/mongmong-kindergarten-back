import { ErrorCode } from '../../common/error-code';
import { DataSource } from 'typeorm';
import { toKstDateString } from '../../common/utils/to-kst-date-string.util';
import { User } from '../user/entities/user.entity';
import {
  AD_REWARDED_AMOUNT,
  ATTENDANCE_REWARD_AMOUNT,
} from './constants/reward-amount.constants';
import { AdViewLog } from './entities/ad-view-log.entity';
import { RewardHistory } from './entities/reward-history.entity';
import { AdType } from './enums/ad-type.enum';
import { RewardType } from './enums/reward-type.enum';
import { RewardService } from './reward.service';

type FakeUser = Pick<User, 'id' | 'rewardCount'>;

function createManagerMock(state: {
  user: FakeUser;
  hasAttendedToday?: boolean;
}) {
  const savedAdViewLogs: Partial<AdViewLog>[] = [];
  const savedRewardHistories: Partial<RewardHistory>[] = [];

  const manager = {
    findOne: (entity: unknown, options: { where: Record<string, unknown> }) => {
      if (entity === User) {
        return options.where.id === state.user.id ? state.user : null;
      }
      if (entity === RewardHistory) {
        return state.hasAttendedToday ? { id: 'h1' } : null;
      }
      throw new Error(`unexpected findOne entity: ${String(entity)}`);
    },
    findOneBy: (entity: unknown, where: Record<string, unknown>) => {
      if (entity === User) {
        return where.id === state.user.id ? state.user : null;
      }
      throw new Error(`unexpected findOneBy entity: ${String(entity)}`);
    },
    save: (entity: unknown, payload: unknown) => {
      if (entity === AdViewLog) {
        savedAdViewLogs.push(payload as Partial<AdViewLog>);
        return payload;
      }
      if (entity === User) {
        return payload;
      }
      if (entity === RewardHistory) {
        const rows = Array.isArray(payload) ? payload : [payload];
        savedRewardHistories.push(...(rows as Partial<RewardHistory>[]));
        return payload;
      }
      throw new Error(`unexpected save entity: ${String(entity)}`);
    },
  };

  return { manager, savedAdViewLogs, savedRewardHistories };
}

function buildService(managerMock: ReturnType<typeof createManagerMock>) {
  const dataSource = {
    transaction: (cb: (manager: unknown) => unknown) => cb(managerMock.manager),
  } as unknown as DataSource;
  return new RewardService({} as never, dataSource);
}

describe('RewardService.recordAdView', () => {
  it('광고를 보면 리워드를 지급하고 시청 기록과 이력을 남긴다', async () => {
    const user: FakeUser = { id: 'u1', rewardCount: 0 };
    const managerMock = createManagerMock({ user });
    const service = buildService(managerMock);

    const result = await service.recordAdView('u1', {
      adType: AdType.INTERSTITIAL,
    });

    expect(result.rewardAmount).toBe(AD_REWARDED_AMOUNT);
    expect(user.rewardCount).toBe(AD_REWARDED_AMOUNT);
    expect(managerMock.savedAdViewLogs).toHaveLength(1);
    expect(managerMock.savedRewardHistories).toContainEqual(
      expect.objectContaining({ userId: 'u1', type: RewardType.AD }),
    );
  });

  it('하루에 여러 번 봐도 매번 지급한다', async () => {
    const user: FakeUser = { id: 'u1', rewardCount: 0 };
    const service = buildService(createManagerMock({ user }));

    await service.recordAdView('u1', { adType: AdType.REWARDED });
    await service.recordAdView('u1', { adType: AdType.REWARDED });

    expect(user.rewardCount).toBe(AD_REWARDED_AMOUNT * 2);
  });
});

describe('RewardService.checkAttendance', () => {
  it('오늘 첫 출석이면 리워드를 지급하고 이력을 남긴다', async () => {
    const user: FakeUser = { id: 'u1', rewardCount: 0 };
    const managerMock = createManagerMock({ user });
    const service = buildService(managerMock);

    const result = await service.checkAttendance('u1');

    expect(result).toEqual({
      attendanceDate: toKstDateString(),
      rewardAmount: ATTENDANCE_REWARD_AMOUNT,
    });
    expect(user.rewardCount).toBe(ATTENDANCE_REWARD_AMOUNT);
    expect(managerMock.savedRewardHistories).toContainEqual(
      expect.objectContaining({ userId: 'u1', type: RewardType.ATTENDANCE }),
    );
  });

  it('오늘 이미 출석했으면 실패하고 리워드를 주지 않는다', async () => {
    const user: FakeUser = { id: 'u1', rewardCount: 0 };
    const managerMock = createManagerMock({ user, hasAttendedToday: true });
    const service = buildService(managerMock);

    await expect(service.checkAttendance('u1')).rejects.toMatchObject({
      code: ErrorCode.ATTENDANCE_ALREADY_CHECKED,
    });
    expect(user.rewardCount).toBe(0);
  });
});
