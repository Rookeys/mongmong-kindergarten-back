import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CharacterStatus } from '../enums/character-status.enum';
import { CharacterItemMap } from './character-item-map.entity';
import { CharacterType } from './character-type.entity';
import { GraduationCard } from './graduation-card.entity';

/**
 * 캐릭터 엔티티 (CHARACTER)
 * 테이블명은 SQL 예약어 충돌을 피해 characters 사용
 */
@Entity('characters')
// 진행 중(GROWING) 캐릭터는 사용자당 1개
@Index(['userId'], { unique: true, where: `status = 'growing'` })
export class Character {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'character_id' })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => User, (user: User) => user.characters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'character_type_id', type: 'bigint' })
  characterTypeId!: string;

  @ManyToOne(() => CharacterType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'character_type_id' })
  characterType!: CharacterType;

  /**
   * 키우기 시작한 날(KST). 1년 뒤가 졸업일이다. 레벨은 이 기간에 쓴 편지 수로 계산한다(컬럼 없음)
   */
  @Column({ name: 'cycle_start_date', type: 'date' })
  cycleStartDate!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: CharacterStatus;

  @Column({ name: 'graduated_at', type: 'timestamptz', nullable: true })
  graduatedAt!: Date | null;

  @Column({ name: 'last_watered_at', type: 'timestamptz', nullable: true })
  lastWateredAt!: Date | null;

  @OneToMany(
    () => GraduationCard,
    (graduationCard: GraduationCard) => graduationCard.character,
  )
  graduationCards!: GraduationCard[];

  @OneToMany(
    () => CharacterItemMap,
    (characterItemMap: CharacterItemMap) => characterItemMap.character,
  )
  itemMaps!: CharacterItemMap[];

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate!: Date;
}
