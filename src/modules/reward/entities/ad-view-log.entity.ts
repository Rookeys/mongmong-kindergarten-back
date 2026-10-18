import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdType } from '../enums/ad-type.enum';

/**
 * 광고 시청 로그 엔티티 (AD_VIEW_LOG)
 */
@Entity('ad_view_log')
@Index(['userId', 'viewDate'])
export class AdViewLog {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'ad_view_log_id' })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => User, (user: User) => user.adViewLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'ad_type', type: 'varchar', length: 30 })
  adType!: AdType;

  @Column({ name: 'view_date', type: 'date' })
  viewDate!: string;

  @Column({ name: 'reward_amount', type: 'int' })
  rewardAmount!: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;
}
