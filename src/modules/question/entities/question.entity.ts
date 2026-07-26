import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuestionContent } from './question-content.entity';
import { QuestionSeries } from './question-series.entity';

/**
 * 질문 엔티티 (QUESTION)
 */
@Entity('question')
export class Question {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'question_id' })
  id!: string;

  @Column({ name: 'question_series_id', type: 'bigint' })
  questionSeriesId!: string;

  @ManyToOne(
    () => QuestionSeries,
    (questionSeries: QuestionSeries) => questionSeries.questions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'question_series_id' })
  questionSeries!: QuestionSeries;

  @Column({ name: 'order_num', type: 'int' })
  orderNum!: number;

  @OneToMany(
    () => QuestionContent,
    (questionContent: QuestionContent) => questionContent.question,
  )
  contents!: QuestionContent[];

  @CreateDateColumn({ name: 'created_date' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date' })
  updatedDate!: Date;
}
