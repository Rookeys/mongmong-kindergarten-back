import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../user/entities/user.entity';
import { AdViewLog } from './entities/ad-view-log.entity';
import { RewardHistory } from './entities/reward-history.entity';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';

/**
 * 리워드 도메인 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([RewardHistory, AdViewLog, User]),
    AuthModule,
  ],
  controllers: [RewardController],
  providers: [RewardService],
  exports: [TypeOrmModule, RewardService],
})
export class RewardModule {}
