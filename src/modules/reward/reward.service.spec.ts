import { ErrorCode } from '../../common/error-code';
import { DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { AD_REWARDED_AMOUNT } from './constants/reward-amount.constants';
import { AdViewLog } from './entities/ad-view-log.entity';
import { RewardHistory } from './entities/reward-history.entity';
import { AdType } from './enums/ad-type.enum';
import { RewardType } from './enums/reward-type.enum';
import { RewardService } from './reward.service';

type FakeUser = Pick<User, 'id' | 'rewardCount'>;

function createManagerMock(state: {
  user: FakeUser;
  existingAdView?: { userId: string; adType: AdType; viewDate: string };
}) {
  const savedAdViewLogs: Partial<AdViewLog>[] = [];
  const savedRewardHistories: Partial<RewardHistory>[] = [];

  const manager = {
    findOneBy: (entity: unknown, where: Record<string, unknown>) => {
      if (entity === AdViewLog) {
        const existing = state.existingAdView;
        if (
          existing &&
          existing.userId === where.userId &&
          existing.adType === where.adType &&
          existing.viewDate === where.viewDate
        ) {
          return existing;
        }
        return null;
      }
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
        savedRewardHistories.push(payload as Partial<RewardHistory>);
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
  it('rewarded 광고는 리워드를 지급하고 이력을 남긴다', async () => {
    const user: FakeUser = { id: 'u1', rewardCount: 0 };
    const managerMock = createManagerMock({ user });
    const service = buildService(managerMock);

    const result = await service.recordAdView('u1', {
      adType: AdType.REWARDED,
    });

    expect(result.rewardAmount).toBe(AD_REWARDED_AMOUNT);
    expect(user.rewardCount).toBe(AD_REWARDED_AMOUNT);
    expect(managerMock.savedRewardHistories).toContainEqual(
      expect.objectContaining({ userId: 'u1', type: RewardType.AD }),
    );
  });

  it('interstitial 광고는 시청만 기록하고 리워드는 지급하지 않는다', async () => {
    const user: FakeUser = { id: 'u1', rewardCount: 0 };
    const managerMock = createManagerMock({ user });
    const service = buildService(managerMock);

    const result = await service.recordAdView('u1', {
      adType: AdType.INTERSTITIAL,
    });

    expect(result.rewardAmount).toBe(0);
    expect(user.rewardCount).toBe(0);
    expect(managerMock.savedRewardHistories).toHaveLength(0);
    expect(managerMock.savedAdViewLogs).toHaveLength(1);
  });

  it('같은 유형 광고를 하루에 두 번 시청하면 실패한다', async () => {
    const user: FakeUser = { id: 'u1', rewardCount: 0 };
    const today = new Date().toISOString().slice(0, 10);
    const managerMock = createManagerMock({
      user,
      existingAdView: {
        userId: 'u1',
        adType: AdType.REWARDED,
        viewDate: today,
      },
    });
    const service = buildService(managerMock);

    await expect(
      service.recordAdView('u1', { adType: AdType.REWARDED }),
    ).rejects.toMatchObject({ code: ErrorCode.AD_ALREADY_VIEWED_TODAY });
  });
});
