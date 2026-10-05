import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { LetterReactionType } from '../enums/letter-reaction-type.enum';
import { Letter } from './letter.entity';

/**
 * 편지 반응 엔티티 (LETTER_REACTION)
 */
@Entity('letter_reaction')
@Unique(['letterId', 'userId'])
export class LetterReaction {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'letter_reaction_id' })
  id!: string;

  @Column({ name: 'letter_id', type: 'bigint' })
  letterId!: string;

  @ManyToOne(() => Letter, (letter: Letter) => letter.reactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'letter_id' })
  letter!: Letter;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => User, (user: User) => user.letterReactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'reaction_type', type: 'varchar', length: 20 })
  reactionType!: LetterReactionType;

  @CreateDateColumn({ name: 'created_date' })
  createdDate!: Date;
}
