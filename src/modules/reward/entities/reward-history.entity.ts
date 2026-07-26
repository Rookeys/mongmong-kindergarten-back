import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RewardType } from '../enums/reward-type.enum';

/**
 * 리워드 이력 엔티티 (REWARD_HISTORY)
 */
@Entity('reward_history')
export class RewardHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'reward_history_id' })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => User, (user: User) => user.rewardHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 30 })
  type!: RewardType;

  @Column({ type: 'int' })
  amount!: number;

  @CreateDateColumn({ name: 'created_date' })
  createdDate!: Date;
}
