import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Item } from '../item/entities/item.entity';
import { RewardModule } from '../reward/reward.module';
import { CharacterItemController } from './character-item.controller';
import { CharacterTypeController } from './character-type.controller';
import { CharacterTypeService } from './character-type.service';
import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';
import { Character } from './entities/character.entity';
import { CharacterItemMap } from './entities/character-item-map.entity';
import { CharacterType } from './entities/character-type.entity';
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
      CharacterType,
      Item,
    ]),
    AuthModule,
    RewardModule,
  ],
  controllers: [
    CharacterController,
    CharacterItemController,
    CharacterTypeController,
  ],
  providers: [CharacterService, CharacterTypeService],
  exports: [TypeOrmModule],
})
export class CharacterModule {}
