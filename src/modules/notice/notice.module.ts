import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Notice } from './entities/notice.entity';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';

/**
 * 공지 도메인 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notice]), AuthModule],
  controllers: [NoticeController],
  providers: [NoticeService],
  exports: [TypeOrmModule],
})
export class NoticeModule {}
