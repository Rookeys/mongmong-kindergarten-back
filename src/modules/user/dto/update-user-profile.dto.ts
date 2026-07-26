import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 사용자 프로필 수정 요청 DTO
 */
export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}
