import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { MoodType } from '../../letter/enums/mood-type.enum';
import { Character } from './character.entity';

/**
 * 졸업 카드 엔티티 (GRADUATION_CARD)
 */
@Entity('graduation_card')
@Index(['userId'])
@Unique(['characterId'])
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

  @Column({ name: 'graduated_at', type: 'timestamptz' })
  graduatedAt!: Date;

  @Column({ name: 'level_snapshot', type: 'int' })
  levelSnapshot!: number;

  @Column({ name: 'character_name_snapshot', type: 'varchar', length: 50 })
  characterNameSnapshot!: string;

  /** 사이클 동안 보낸 편지 수 */
  @Column({ name: 'letter_count_snapshot', type: 'int' })
  letterCountSnapshot!: number;

  /** 사이클 동안 가장 많이 보낸 기분 (기분을 고른 편지가 없으면 null) */
  @Column({
    name: 'top_mood_snapshot',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  topMoodSnapshot!: MoodType | null;

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

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;
}
