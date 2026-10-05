import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

/**
 * 사용자 차단 엔티티 (USER_BLOCK)
 */
@Entity('user_block')
@Unique(['blockerUserId', 'blockedUserId'])
export class UserBlock {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_block_id' })
  id!: string;

  @Column({ name: 'blocker_user_id', type: 'bigint' })
  blockerUserId!: string;

  @ManyToOne(() => User, (user: User) => user.blockingUsers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blocker_user_id' })
  blockerUser!: User;

  @Column({ name: 'blocked_user_id', type: 'bigint' })
  blockedUserId!: string;

  @ManyToOne(() => User, (user: User) => user.blockedByUsers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blocked_user_id' })
  blockedUser!: User;

  @CreateDateColumn({ name: 'created_date' })
  createdDate!: Date;
}
