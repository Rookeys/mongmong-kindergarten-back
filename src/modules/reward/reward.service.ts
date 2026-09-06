import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { AD_REWARDED_AMOUNT } from './constants/reward-amount.constants';
import {
  CreateAdViewRequestDto,
  CreateAdViewResponseDto,
  GetRewardHistoryResponseDto,
} from './dto';
import { AdViewLog } from './entities/ad-view-log.entity';
import { RewardHistory } from './entities/reward-history.entity';
import { AdType } from './enums/ad-type.enum';
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
   * 광고 시청을 기록하고, rewarded 광고인 경우 하루 1회 리워드를 지급한다.
   * 출석체크(하루 1회 접속 보상)도 rewarded 유형 시청으로 처리한다.
   */
  async recordAdView(
    userId: string,
    dto: CreateAdViewRequestDto,
  ): Promise<CreateAdViewResponseDto> {
    const viewDate = new Date().toISOString().slice(0, 10);
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const alreadyViewed = await manager.findOneBy(AdViewLog, {
        userId,
        adType: dto.adType,
        viewDate,
      });
      if (alreadyViewed) {
        throw new BadRequestException('오늘은 이미 시청한 광고입니다.');
      }

      const rewardAmount =
        dto.adType === AdType.REWARDED ? AD_REWARDED_AMOUNT : 0;

      await manager.save(AdViewLog, {
        userId,
        adType: dto.adType,
        viewDate,
        rewardAmount,
      });

      if (rewardAmount > 0) {
        const user = await manager.findOneBy(User, { id: userId });
        if (!user) {
          throw new NotFoundException('사용자를 찾을 수 없습니다.');
        }
        user.rewardCount += rewardAmount;
        await manager.save(User, user);
        await manager.save(RewardHistory, {
          userId,
          type: RewardType.AD,
          amount: rewardAmount,
        });
      }

      return { adType: dto.adType, viewDate, rewardAmount };
    });
  }
}
