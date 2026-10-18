import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NoticeType } from '../enums/notice-type.enum';

/**
 * 공지 엔티티 (NOTICE)
 */
@Entity('notice')
export class Notice {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notice_id' })
  id!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: NoticeType;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'is_published', type: 'boolean' })
  isPublished!: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate!: Date;
}
