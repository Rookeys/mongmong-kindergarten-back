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
      const user = await manager.findOneBy(User, { id: userId });
      if (!user) {
        throw AppException.withTarget(ErrorCode.USER_NOT_FOUND, {
          userId: userId,
        });
      }
      // ponytail: 클라이언트 신고만 믿고 지급한다. 어뷰징이 보이면 광고 SDK 서버 검증(SSV) 붙이기
      await manager.save(AdViewLog, {
        userId,
        adType: dto.adType,
        viewDate,
        rewardAmount: AD_REWARDED_AMOUNT,
      });
      user.rewardCount += AD_REWARDED_AMOUNT;
      await manager.save(User, user);
      await manager.save(RewardHistory, {
        userId,
        type: RewardType.AD,
        amount: AD_REWARDED_AMOUNT,
      });
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
      // ponytail: 조회 후 저장이라 동시 요청 시 중복 지급 가능. 문제되면 (user_id, 날짜) 유니크 컬럼 추가
      const alreadyChecked = await manager.findOne(RewardHistory, {
        where: this.buildAttendanceWhere(userId, attendanceDate),
      });
      if (alreadyChecked) {
        throw new AppException(ErrorCode.ATTENDANCE_ALREADY_CHECKED);
      }
      const user = await manager.findOneBy(User, { id: userId });
      if (!user) {
        throw AppException.withTarget(ErrorCode.USER_NOT_FOUND, {
          userId: userId,
        });
      }
      user.rewardCount += ATTENDANCE_REWARD_AMOUNT;
      await manager.save(User, user);
      await manager.save(RewardHistory, {
        userId,
        type: RewardType.ATTENDANCE,
        amount: ATTENDANCE_REWARD_AMOUNT,
      });
      return { attendanceDate, rewardAmount: ATTENDANCE_REWARD_AMOUNT };
    });
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
