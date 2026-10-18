import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { QuestionContent } from './question-content.entity';
import { QuestionSeries } from './question-series.entity';

/**
 * 질문 엔티티 (QUESTION)
 */
@Entity('question')
@Unique(['questionSeriesId', 'orderNum'])
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

  /** 달력 날짜 순번: 1월 1일 = 1 ~ 12월 31일 = 365 */
  @Column({ name: 'order_num', type: 'int' })
  orderNum!: number;

  @OneToMany(
    () => QuestionContent,
    (questionContent: QuestionContent) => questionContent.question,
  )
  contents!: QuestionContent[];

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate!: Date;
}
