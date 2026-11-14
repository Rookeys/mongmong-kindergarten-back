import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { NICKNAME_PATTERN } from '../../constants/nickname.constants';
import { UserStatus } from '../../enums/user-status.enum';

/**
 * 사용자 부분 수정 요청 DTO
 */
export class UpdateUserRequestDto {
  @ApiPropertyOptional({
    description: '닉네임 (2~8자, 한글·일본어·영문 소문자·숫자)',
    example: '새닉네임',
    minLength: 2,
    maxLength: 8,
  })
  @IsOptional()
  @IsString()
  @Matches(NICKNAME_PATTERN)
  nickname?: string;

  @ApiPropertyOptional({
    description: '계정 상태',
    enum: UserStatus,
    enumName: 'UserStatus',
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: '선택한 질문 시리즈 ID (온보딩 시 선택)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  questionSeriesId?: string;
}
