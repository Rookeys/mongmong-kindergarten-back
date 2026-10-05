import { AiReply } from '../../letter/entities/ai-reply.entity';
import { LetterReaction } from '../../letter/entities/letter-reaction.entity';
import { LetterReport } from '../../letter/entities/letter-report.entity';
import { Letter } from '../../letter/entities/letter.entity';
import { Character } from '../../character/entities/character.entity';
import { GraduationCard } from '../../character/entities/graduation-card.entity';
import { QuestionSeries } from '../../question/entities/question-series.entity';
import { AdViewLog } from '../../reward/entities/ad-view-log.entity';
import { RewardHistory } from '../../reward/entities/reward-history.entity';
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
import { LoginType } from '../enums/login-type.enum';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { UserBlock } from './user-block.entity';
import { UserDevice } from './user-device.entity';
import { UserInvite } from './user-invite.entity';
import { UserSetting } from './user-setting.entity';

/**
 * 사용자 엔티티 (USER)
 * ERD 기준 + 소셜 로그인 식별을 위한 providerId(기존 Auth.providerId 호환)
 */
@Entity('user')
@Index(['loginType', 'providerId'], { unique: true })
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_id' })
  id!: string;

  @Column({ name: 'question_series_id', type: 'bigint', nullable: true })
  questionSeriesId!: string | null;

  @ManyToOne(() => QuestionSeries, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'question_series_id' })
  questionSeries!: QuestionSeries | null;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password!: string | null;

  /** 카카오 가입 직후에는 null이고 온보딩(이름 설정)에서 채운다 */
  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname!: string | null;

  @Column({ name: 'login_type', type: 'varchar', length: 20 })
  loginType!: LoginType;

  /**
   * 소셜 제공자 사용자 ID (로컬은 null)
   * ERD에는 없지만 카카오 중복 가입 방지용으로 유지
   */
  @Column({ name: 'provider_id', type: 'varchar', length: 255, nullable: true })
  providerId!: string | null;

  @Column({ name: 'reward_count', type: 'int', default: 0 })
  rewardCount!: number;

  @Column({ name: 'ai_reply_cycle', type: 'int', default: 0 })
  aiReplyCycle!: number;

  @Column({ name: 'my_invite_code', type: 'varchar', length: 20, unique: true })
  myInviteCode!: string;

  @Column({
    name: 'friend_invite_code',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  friendInviteCode!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: UserStatus;

  @Column({ type: 'varchar', length: 20, default: UserRole.USER })
  role!: UserRole;

  @Column({ name: 'deleted_request_at', type: 'timestamp', nullable: true })
  deletedRequestAt!: Date | null;

  @Column({ name: 'last_login_date', type: 'timestamp', nullable: true })
  lastLoginDate!: Date | null;

  @OneToMany(() => UserSetting, (userSetting: UserSetting) => userSetting.user)
  settings!: UserSetting[];

  @OneToMany(
    () => RewardHistory,
    (rewardHistory: RewardHistory) => rewardHistory.user,
  )
  rewardHistories!: RewardHistory[];

  @OneToMany(() => AdViewLog, (adViewLog: AdViewLog) => adViewLog.user)
  adViewLogs!: AdViewLog[];

  @OneToMany(() => UserDevice, (userDevice: UserDevice) => userDevice.user)
  devices!: UserDevice[];

  @OneToMany(
    () => UserInvite,
    (userInvite: UserInvite) => userInvite.inviterUser,
  )
  sentInvites!: UserInvite[];

  @OneToMany(
    () => UserInvite,
    (userInvite: UserInvite) => userInvite.inviteeUser,
  )
  receivedInvites!: UserInvite[];

  @OneToMany(() => UserBlock, (userBlock: UserBlock) => userBlock.blockerUser)
  blockingUsers!: UserBlock[];

  @OneToMany(() => UserBlock, (userBlock: UserBlock) => userBlock.blockedUser)
  blockedByUsers!: UserBlock[];

  @OneToMany(() => Letter, (letter: Letter) => letter.user)
  letters!: Letter[];

  @OneToMany(() => AiReply, (aiReply: AiReply) => aiReply.user)
  aiReplies!: AiReply[];

  @OneToMany(
    () => LetterReaction,
    (letterReaction: LetterReaction) => letterReaction.user,
  )
  letterReactions!: LetterReaction[];

  @OneToMany(
    () => LetterReport,
    (letterReport: LetterReport) => letterReport.reporterUser,
  )
  letterReports!: LetterReport[];

  @OneToMany(() => Character, (character: Character) => character.user)
  characters!: Character[];

  @OneToMany(
    () => GraduationCard,
    (graduationCard: GraduationCard) => graduationCard.user,
  )
  graduationCards!: GraduationCard[];

  @CreateDateColumn({ name: 'created_date' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date' })
  updatedDate!: Date;
}
