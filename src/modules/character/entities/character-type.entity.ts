import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 캐릭터 종류 엔티티 (CHARACTER_TYPE). 예: 몽몽이, 햄몽이, 빼몽이
 * 종류는 계속 늘어날 수 있어 enum이 아니라 테이블로 두고 관리자 API로 관리한다.
 */
@Entity('character_type')
export class CharacterType {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'character_type_id' })
  id!: string;

  /** 캐릭터 이름 (종류 이름이 곧 캐릭터 이름) */
  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  /** false면 새 캐릭터로 배정하지 않는다. 이미 키우는 캐릭터와 졸업 카드는 그대로 */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate!: Date;
}
