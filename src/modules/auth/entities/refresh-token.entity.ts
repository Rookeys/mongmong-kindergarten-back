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

/**
 * 리프레시 토큰 엔티티 (REFRESH_TOKEN)
 * 로그인(기기)마다 1행. 원문은 저장하지 않고 SHA-256 해시만 둔다.
 */
@Entity('refresh_token')
@Index(['userId'])
export class RefreshToken {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'refresh_token_id' })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;
}
