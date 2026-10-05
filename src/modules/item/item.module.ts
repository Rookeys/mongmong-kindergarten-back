import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Item } from './entities/item.entity';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';

/**
 * 아이템 도메인 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([Item]), AuthModule],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [TypeOrmModule],
})
export class ItemModule {}
