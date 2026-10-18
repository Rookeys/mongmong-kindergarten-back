import { ApiProperty } from '@nestjs/swagger';
import { LoginType } from '../../enums/login-type.enum';
import { UserRole } from '../../enums/user-role.enum';
import { UserStatus } from '../../enums/user-status.enum';

/**
 * 사용자 공통 응답 DTO (비밀번호 제외)
 * OpenAPI Generator용 스키마
 */
export class GetUserResponseDto {
  @ApiProperty({ description: '사용자 ID', example: '1' })
  id!: string;

  @ApiProperty({
    description: '이메일 (카카오가 이메일을 주지 않으면 null)',
    example: 'user@example.com',
    nullable: true,
    type: String,
  })
  email!: string | null;

  @ApiProperty({
    description: '닉네임 (null이면 이름 설정 온보딩 필요)',
    example: '몽몽이',
    nullable: true,
    type: String,
  })
  nickname!: string | null;

  @ApiProperty({
    description: '로그인 유형',
    enum: LoginType,
    enumName: 'LoginType',
    example: LoginType.LOCAL,
  })
  loginType!: LoginType;

  @ApiProperty({
    description: '소셜 제공자 사용자 ID (로컬은 null)',
    example: null,
    nullable: true,
    type: String,
  })
  providerId!: string | null;

  @ApiProperty({ description: '리워드 보유량', example: 0 })
  rewardCount!: number;

  @ApiProperty({ description: 'AI 답장 사이클', example: 0 })
  aiReplyCycle!: number;

  @ApiProperty({ description: '내 초대 코드', example: 'AB12CD34' })
  myInviteCode!: string;

  @ApiProperty({
    description: '계정 상태',
    enum: UserStatus,
    enumName: 'UserStatus',
    example: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @ApiProperty({
    description: '권한',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.USER,
  })
  role!: UserRole;

  @ApiProperty({
    description: '마지막 로그인 일시',
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-07-26T12:00:00.000Z',
  })
  lastLoginDate!: Date | null;

  @ApiProperty({
    description: '선택한 질문 시리즈 ID',
    example: null,
    nullable: true,
    type: String,
  })
  questionSeriesId!: string | null;

  @ApiProperty({
    description: '탈퇴 요청 일시',
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
  })
  deletedRequestAt!: Date | null;

  @ApiProperty({
    description: '생성 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  createdDate!: Date;

  @ApiProperty({
    description: '수정 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  updatedDate!: Date;
}
