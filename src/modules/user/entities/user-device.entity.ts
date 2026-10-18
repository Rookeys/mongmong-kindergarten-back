import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DevicePlatform } from '../enums/device-platform.enum';
import { User } from './user.entity';

/**
 * 사용자 디바이스 엔티티 (USER_DEVICE)
 */
@Entity('user_device')
export class UserDevice {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_device_id' })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => User, (user: User) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'device_token', type: 'varchar', length: 255 })
  deviceToken!: string;

  @Column({ type: 'varchar', length: 10 })
  platform!: DevicePlatform;

  @Column({ name: 'app_version', type: 'varchar', length: 20, nullable: true })
  appVersion!: string | null;

  @Column({ name: 'last_active_date', type: 'timestamptz', nullable: true })
  lastActiveDate!: Date | null;

  @Column({ name: 'use_yn', type: 'boolean' })
  useYn!: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate!: Date;
}
