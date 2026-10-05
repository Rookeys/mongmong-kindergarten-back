import { LocaleType } from '../../../common/enums/locale-type.enum';
import { Question } from '../../question/entities/question.entity';
import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { AiReply } from './ai-reply.entity';
import { LetterReaction } from './letter-reaction.entity';
import { LetterReport } from './letter-report.entity';

/**
 * 편지 엔티티 (LETTER)
 */
@Entity('letter')
@Unique(['userId', 'letterDate'])
@Index(['questionId'])
export class Letter {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'letter_id' })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => User, (user: User) => user.letters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'question_id', type: 'bigint' })
  questionId!: string;

  @ManyToOne(() => Question, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  /** 일지가 속한 날짜(KST). 질문은 이 날짜로 정해지고 하루에 한 통만 쓸 수 있다 */
  @Column({ name: 'letter_date', type: 'date' })
  letterDate!: string;

  @Column({ type: 'text' })
  answer!: string;

  @Column({ name: 'mood_number', type: 'int', nullable: true })
  moodNumber!: number | null;

  @Column({ name: 'is_private', type: 'boolean' })
  isPrivate!: boolean;

  @Column({ name: 'is_private_sns', type: 'boolean' })
  isPrivateSns!: boolean;

  @Column({ name: 'locale_type', type: 'varchar', length: 10 })
  localeType!: LocaleType;

  @OneToMany(() => AiReply, (aiReply: AiReply) => aiReply.letter)
  aiReplies!: AiReply[];

  @OneToMany(
    () => LetterReaction,
    (letterReaction: LetterReaction) => letterReaction.letter,
  )
  reactions!: LetterReaction[];

  @OneToMany(
    () => LetterReport,
    (letterReport: LetterReport) => letterReport.letter,
  )
  reports!: LetterReport[];

  @CreateDateColumn({ name: 'created_date' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date' })
  updatedDate!: Date;
}
