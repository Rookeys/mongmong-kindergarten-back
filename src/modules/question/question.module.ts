import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../user/entities/user.entity';
import { Question } from './entities/question.entity';
import { QuestionContent } from './entities/question-content.entity';
import { QuestionSeries } from './entities/question-series.entity';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';

/**
 * 질문 도메인 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionSeries, Question, QuestionContent, User]),
    AuthModule,
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [TypeOrmModule],
})
export class QuestionModule {}
