import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { NICKNAME_PATTERN } from '../../user/constants/nickname.constants';

/**
 * 내 프로필 수정 요청 DTO
 * 계정 상태 등 관리자 전용 필드는 받지 않는다.
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
    description:
      '친구 초대 코드 (온보딩에서 선택 입력). 첫 일지를 쓰면 초대한 사람·나 모두 보상. 한 번만, 첫 일지 전에만 등록 가능',
    example: 'AB12CD34',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  friendInviteCode?: string;

  @ApiPropertyOptional({
    description: '선택한 질문 시리즈 ID',
    example: '1',
  })
  @IsOptional()
  @IsString()
  questionSeriesId?: string;
}
