import { LocaleType } from '../../../common/enums/locale-type.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

/**
 * 사용자 설정 엔티티 (USER_SETTING)
 */
@Entity('user_setting')
@Unique(['userId'])
export class UserSetting {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_setting_id' })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => User, (user: User) => user.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'locale_type', type: 'varchar', length: 10 })
  localeType!: LocaleType;

  @Column({ name: 'set_letter_is_private', type: 'boolean' })
  setLetterIsPrivate!: boolean;

  @Column({ name: 'set_letter_is_private_sns', type: 'boolean' })
  setLetterIsPrivateSns!: boolean;

  @Column({ name: 'push_enabled', type: 'boolean' })
  pushEnabled!: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate!: Date;
}
