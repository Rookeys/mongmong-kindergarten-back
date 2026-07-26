import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoginType } from '../../enums/login-type.enum';
import { UserStatus } from '../../enums/user-status.enum';

/**
 * 사용자 공통 응답 DTO (비밀번호 제외)
 * OpenAPI Generator용 스키마
 */
export class GetUserResponseDto {
  @ApiProperty({ description: '사용자 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '이메일', example: 'user@example.com' })
  email!: string;

  @ApiProperty({ description: '닉네임', example: '몽몽이' })
  nickname!: string;

  @ApiProperty({
    description: '로그인 유형',
    enum: LoginType,
    example: LoginType.LOCAL,
  })
  loginType!: LoginType;

  @ApiPropertyOptional({
    description: '소셜 제공자 사용자 ID (로컬은 null)',
    example: null,
    nullable: true,
  })
  providerId!: string | null;

  @ApiProperty({ description: '리워드 보유량', example: 0 })
  rewardCount!: number;

  @ApiProperty({ description: 'AI 답장 사이클', example: 0 })
  aiReplyCycle!: number;

  @ApiProperty({ description: '내 초대 코드', example: 'AB12CD34' })
  myInviteCode!: string;

  @ApiPropertyOptional({
    description: '가입 시 입력한 친구 초대 코드',
    example: null,
    nullable: true,
  })
  friendInviteCode!: string | null;

  @ApiProperty({
    description: '계정 상태',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @ApiPropertyOptional({
    description: '마지막 로그인 일시',
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-07-26T12:00:00.000Z',
  })
  lastLoginDate!: Date | null;

  @ApiPropertyOptional({
    description: '현재 진행 중 질문 ID',
    example: null,
    nullable: true,
  })
  currentQuestionId!: string | null;

  @ApiPropertyOptional({
    description: '선택한 질문 시리즈 ID',
    example: null,
    nullable: true,
  })
  questionSeriesId!: string | null;

  @ApiPropertyOptional({
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
