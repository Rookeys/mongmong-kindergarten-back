import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { QuestionContent } from './entities/question-content.entity';
import { QuestionSeries } from './entities/question-series.entity';

/**
 * 질문 도메인 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionSeries, Question, QuestionContent]),
  ],
  exports: [TypeOrmModule],
})
export class QuestionModule {}
