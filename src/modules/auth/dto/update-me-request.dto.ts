import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { NICKNAME_PATTERN } from '../../user/constants/nickname.constants';

/**
 * 내 프로필 수정 요청 DTO
 * 계정 상태·초대 코드 등 관리자 전용 필드는 받지 않는다.
 */
export class UpdateMeRequestDto {
  @ApiPropertyOptional({
    description: '닉네임 (2~8자, 한글·영문 소문자·숫자)',
    example: '진주',
    minLength: 2,
    maxLength: 8,
  })
  @IsOptional()
  @IsString()
  @Matches(NICKNAME_PATTERN)
  nickname?: string;

  @ApiPropertyOptional({
    description: '선택한 질문 시리즈 ID',
    example: '1',
  })
  @IsOptional()
  @IsString()
  questionSeriesId?: string;
}
