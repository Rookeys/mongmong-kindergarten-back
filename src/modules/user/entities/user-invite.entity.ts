import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

/**
 * 사용자 초대 엔티티 (USER_INVITE)
 */
@Entity('user_invite')
@Unique(['inviteeUserId'])
export class UserInvite {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_invite_id' })
  id!: string;

  @Column({ name: 'inviter_user_id', type: 'bigint' })
  inviterUserId!: string;

  @ManyToOne(() => User, (user: User) => user.sentInvites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inviter_user_id' })
  inviterUser!: User;

  @Column({ name: 'invitee_user_id', type: 'bigint' })
  inviteeUserId!: string;

  @ManyToOne(() => User, (user: User) => user.receivedInvites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invitee_user_id' })
  inviteeUser!: User;

  @Column({ name: 'invite_code', type: 'varchar', length: 20 })
  inviteCode!: string;

  @Column({ name: 'reward_given_yn', type: 'boolean' })
  rewardGivenYn!: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;
}
