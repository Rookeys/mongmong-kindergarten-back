import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Letter } from './letter.entity';

/**
 * AI 답장 엔티티 (AI_REPLY)
 */
@Entity('ai_reply')
@Index(['letterId'])
export class AiReply {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'ai_reply_id' })
  id!: string;

  @Column({ name: 'letter_id', type: 'bigint' })
  letterId!: string;

  @ManyToOne(() => Letter, (letter: Letter) => letter.aiReplies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'letter_id' })
  letter!: Letter;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'is_read', type: 'boolean' })
  isRead!: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;
}
