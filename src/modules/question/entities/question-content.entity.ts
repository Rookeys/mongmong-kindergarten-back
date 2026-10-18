import { LocaleType } from '../../../common/enums/locale-type.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Question } from './question.entity';

/**
 * 질문 다국어 콘텐츠 엔티티 (QUESTION_CONTENT)
 */
@Entity('question_content')
@Unique(['questionId', 'localeType'])
export class QuestionContent {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'question_content_id' })
  id!: string;

  @Column({ name: 'question_id', type: 'bigint' })
  questionId!: string;

  @ManyToOne(() => Question, (question: Question) => question.contents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'locale_type', type: 'varchar', length: 10 })
  localeType!: LocaleType;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;
}
