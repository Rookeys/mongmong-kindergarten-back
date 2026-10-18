import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { toKstDateString } from '../../common/utils/to-kst-date-string.util';
import { User } from '../user/entities/user.entity';
import {
  AD_REWARDED_AMOUNT,
  ATTENDANCE_REWARD_AMOUNT,
} from './constants/reward-amount.constants';
import {
  CreateAdViewRequestDto,
  CreateAdViewResponseDto,
  CreateAttendanceResponseDto,
  GetAttendanceResponseDto,
  GetRewardHistoryResponseDto,
} from './dto';
import { AdViewLog } from './entities/ad-view-log.entity';
import { RewardHistory } from './entities/reward-history.entity';
import { RewardType } from './enums/reward-type.enum';
import { RewardEntry } from './types/reward-entry.type';

/**
 * 리워드(꿈조각) 서비스
 */
@Injectable()
export class RewardService {
  constructor(
    @InjectRepository(RewardHistory)
    private readonly rewardHistoryRepository: Repository<RewardHistory>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 내 리워드 적립 이력을 조회한다.
   */
  async findMyHistory(userId: string): Promise<GetRewardHistoryResponseDto[]> {
    const histories = await this.rewardHistoryRepository.find({
      where: { userId },
      order: { createdDate: 'DESC' },
    });
    return histories.map((history) => ({
      id: history.id,
      type: history.type,
      amount: history.amount,
      createdDate: history.createdDate,
    }));
  }

  /**
   * 광고 시청을 기록하고 리워드를 지급한다. 횟수 제한은 없다.
   */
  async recordAdView(
    userId: string,
    dto: CreateAdViewRequestDto,
  ): Promise<CreateAdViewResponseDto> {
    const viewDate = toKstDateString();
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const user = await this.lockUser(manager, userId);
      // ponytail: 클라이언트 신고만 믿고 지급한다. 어뷰징이 보이면 광고 SDK 서버 검증(SSV) 붙이기
      await manager.save(AdViewLog, {
        userId,
        adType: dto.adType,
        viewDate,
        rewardAmount: AD_REWARDED_AMOUNT,
      });
      await this.applyRewards(manager, user, [
        { type: RewardType.AD, amount: AD_REWARDED_AMOUNT },
      ]);
      return { adType: dto.adType, viewDate, rewardAmount: AD_REWARDED_AMOUNT };
    });
  }

  /**
   * 오늘(KST) 출석체크를 했는지 조회한다.
   */
  async findTodayAttendance(userId: string): Promise<GetAttendanceResponseDto> {
    const attendanceDate = toKstDateString();
    const isChecked = await this.rewardHistoryRepository.existsBy(
      this.buildAttendanceWhere(userId, attendanceDate),
    );
    return { attendanceDate, isChecked };
  }

  /**
   * 출석체크를 하고 리워드를 지급한다. 하루(KST) 1회만 가능하다.
   */
  async checkAttendance(userId: string): Promise<CreateAttendanceResponseDto> {
    const attendanceDate = toKstDateString();
    return this.dataSource.transaction(async (manager: EntityManager) => {
      // 잠금이 먼저여야 동시 요청의 두 번째가 첫 요청의 출석 이력을 본다
      const user = await this.lockUser(manager, userId);
      const alreadyChecked = await manager.findOne(RewardHistory, {
        where: this.buildAttendanceWhere(userId, attendanceDate),
      });
      if (alreadyChecked) {
        throw new AppException(ErrorCode.ATTENDANCE_ALREADY_CHECKED);
      }
      await this.applyRewards(manager, user, [
        { type: RewardType.ATTENDANCE, amount: ATTENDANCE_REWARD_AMOUNT },
      ]);
      return { attendanceDate, rewardAmount: ATTENDANCE_REWARD_AMOUNT };
    });
  }

  /**
   * 트랜잭션 안에서 사용자 행을 잠그고 가져온다.
   * 같은 사용자의 재화 변경을 순서대로 처리하려면 트랜잭션의 첫 쿼리로 호출한다.
   */
  async lockUser(manager: EntityManager, userId: string): Promise<User> {
    const user = await manager.findOne(User, {
      where: { id: userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!user) {
      throw AppException.withTarget(ErrorCode.USER_NOT_FOUND, {
        userId: userId,
      });
    }
    return user;
  }

  /**
   * 잔액이 required보다 적으면 REWARD_INSUFFICIENT를 던진다.
   */
  ensureSufficientBalance(user: User, required: number): void {
    if (user.rewardCount >= required) {
      return;
    }
    throw new AppException(
      ErrorCode.REWARD_INSUFFICIENT,
      { required, current: user.rewardCount },
      undefined,
      `리워드(꿈조각)가 부족합니다. (필요 ${required}개, 보유 ${user.rewardCount}개)`,
    );
  }

  /**
   * 잠근 사용자에게 리워드를 지급/차감하고 이력을 남긴다. 합계를 반환한다.
   */
  async applyRewards(
    manager: EntityManager,
    user: User,
    rewards: RewardEntry[],
  ): Promise<number> {
    const total = rewards.reduce((sum, reward) => sum + reward.amount, 0);
    user.rewardCount += total;
    await manager.save(User, user);
    await manager.save(
      RewardHistory,
      rewards.map((reward) => ({ userId: user.id, ...reward })),
    );
    return total;
  }

  private buildAttendanceWhere(
    userId: string,
    attendanceDate: string,
  ): FindOptionsWhere<RewardHistory> {
    return {
      userId,
      type: RewardType.ATTENDANCE,
      createdDate: MoreThanOrEqual(
        new Date(`${attendanceDate}T00:00:00+09:00`),
      ),
    };
  }
}
