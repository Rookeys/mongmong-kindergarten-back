import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from './entities/character.entity';
import { CharacterItemMap } from './entities/character-item-map.entity';
import { GraduationCard } from './entities/graduation-card.entity';

/**
 * 캐릭터 도메인 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Character, GraduationCard, CharacterItemMap]),
  ],
  exports: [TypeOrmModule],
})
export class CharacterModule {}
