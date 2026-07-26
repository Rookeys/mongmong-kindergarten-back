import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdViewLog } from './entities/ad-view-log.entity';
import { RewardHistory } from './entities/reward-history.entity';

/**
 * 리워드 도메인 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([RewardHistory, AdViewLog])],
  exports: [TypeOrmModule],
})
export class RewardModule {}
