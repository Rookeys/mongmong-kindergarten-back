import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';

/**
 * 아이템 도메인 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([Item])],
  exports: [TypeOrmModule],
})
export class ItemModule {}
