import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from './entities/notice.entity';

/**
 * 공지 도메인 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notice])],
  exports: [TypeOrmModule],
})
export class NoticeModule {}
