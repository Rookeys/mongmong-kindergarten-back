import { Item } from '../../item/entities/item.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Character } from './character.entity';

/**
 * 캐릭터-아이템 매핑 엔티티 (CHARACTER_ITEM_MAP)
 */
@Entity('character_item_map')
@Unique(['characterId', 'itemId'])
export class CharacterItemMap {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'character_item_map_id' })
  id!: string;

  @Column({ name: 'character_id', type: 'bigint' })
  characterId!: string;

  @ManyToOne(() => Character, (character: Character) => character.itemMaps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'character_id' })
  character!: Character;

  @Column({ name: 'item_id', type: 'bigint' })
  itemId!: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ name: 'is_equipped', type: 'boolean' })
  isEquipped!: boolean;

  @CreateDateColumn({ name: 'created_date' })
  createdDate!: Date;
}
