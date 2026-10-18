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
import { LetterReportReasonType } from '../enums/letter-report-reason-type.enum';
import { LetterReportStatus } from '../enums/letter-report-status.enum';
import { Letter } from './letter.entity';

/**
 * 편지 신고 엔티티 (LETTER_REPORT)
 */
@Entity('letter_report')
@Index(['letterId'])
// 한 사람은 같은 일지를 한 번만 신고한다
@Unique(['letterId', 'reporterUserId'])
export class LetterReport {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'letter_report_id' })
  id!: string;

  @Column({ name: 'letter_id', type: 'bigint' })
  letterId!: string;

  @ManyToOne(() => Letter, (letter: Letter) => letter.reports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'letter_id' })
  letter!: Letter;

  @Column({ name: 'reporter_user_id', type: 'bigint' })
  reporterUserId!: string;

  @ManyToOne(() => User, (user: User) => user.letterReports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reporter_user_id' })
  reporterUser!: User;

  @Column({ name: 'reason_type', type: 'varchar', length: 30, nullable: true })
  reasonType!: LetterReportReasonType | null;

  @Column({
    name: 'reason_detail',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  reasonDetail!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: LetterReportStatus;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;
}
