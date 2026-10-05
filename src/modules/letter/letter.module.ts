import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { QuestionModule } from '../question/question.module';
import { RewardHistory } from '../reward/entities/reward-history.entity';
import { User } from '../user/entities/user.entity';
import { UserInvite } from '../user/entities/user-invite.entity';
import { AiReply } from './entities/ai-reply.entity';
import { Letter } from './entities/letter.entity';
import { LetterReaction } from './entities/letter-reaction.entity';
import { LetterReport } from './entities/letter-report.entity';
import { AiReplyController } from './ai-reply.controller';
import { LetterController } from './letter.controller';
import { LetterService } from './letter.service';

/**
 * 편지 도메인 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Letter,
      AiReply,
      LetterReaction,
      LetterReport,
      User,
      UserInvite,
      RewardHistory,
    ]),
    AuthModule,
    QuestionModule,
  ],
  controllers: [LetterController, AiReplyController],
  providers: [LetterService],
  exports: [TypeOrmModule],
})
export class LetterModule {}
