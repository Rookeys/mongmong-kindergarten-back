import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiReply } from './entities/ai-reply.entity';
import { Letter } from './entities/letter.entity';
import { LetterReaction } from './entities/letter-reaction.entity';
import { LetterReport } from './entities/letter-report.entity';

/**
 * 편지 도메인 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Letter, AiReply, LetterReaction, LetterReport]),
  ],
  exports: [TypeOrmModule],
})
export class LetterModule {}
