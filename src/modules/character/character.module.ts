import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Item } from '../item/entities/item.entity';
import { RewardModule } from '../reward/reward.module';
import { CharacterItemController } from './character-item.controller';
import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';
import { Character } from './entities/character.entity';
import { CharacterItemMap } from './entities/character-item-map.entity';
import { GraduationCard } from './entities/graduation-card.entity';

/**
 * 캐릭터 도메인 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Character,
      GraduationCard,
      CharacterItemMap,
      Item,
    ]),
    AuthModule,
    RewardModule,
  ],
  controllers: [CharacterController, CharacterItemController],
  providers: [CharacterService],
  exports: [TypeOrmModule],
})
export class CharacterModule {}
