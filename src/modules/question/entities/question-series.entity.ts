import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Question } from './question.entity';

/**
 * 질문 시리즈 엔티티 (QUESTION_SERIES)
 */
@Entity('question_series')
export class QuestionSeries {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'question_series_id' })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 500, nullable: true })
  thumbnailUrl!: string | null;

  @OneToMany(() => Question, (question: Question) => question.questionSeries)
  questions!: Question[];

  @CreateDateColumn({ name: 'created_date' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date' })
  updatedDate!: Date;
}
