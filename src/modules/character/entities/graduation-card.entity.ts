import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Character } from './character.entity';

/**
 * 졸업 카드 엔티티 (GRADUATION_CARD)
 */
@Entity('graduation_card')
export class GraduationCard {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'graduation_card_id' })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => User, (user: User) => user.graduationCards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'character_id', type: 'bigint' })
  characterId!: string;

  @ManyToOne(
    () => Character,
    (character: Character) => character.graduationCards,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'character_id' })
  character!: Character;

  @Column({ name: 'graduated_at', type: 'timestamp' })
  graduatedAt!: Date;

  @Column({ name: 'level_snapshot', type: 'int' })
  levelSnapshot!: number;

  @Column({
    name: 'equipped_items_snapshot',
    type: 'jsonb',
    nullable: true,
  })
  equippedItemsSnapshot!: Record<string, unknown> | null;

  @Column({
    name: 'card_image_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  cardImageUrl!: string | null;

  @Column({ name: 'period_start', type: 'date', nullable: true })
  periodStart!: string | null;

  @Column({ name: 'period_end', type: 'date', nullable: true })
  periodEnd!: string | null;

  @CreateDateColumn({ name: 'created_date' })
  createdDate!: Date;
}
