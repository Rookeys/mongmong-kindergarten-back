import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UserStatus } from '../../enums/user-status.enum';

/**
 * 사용자 부분 수정 요청 DTO
 */
export class UpdateUserRequestDto {
  @ApiPropertyOptional({
    description: '닉네임',
    example: '새닉네임',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({
    description: '계정 상태',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: '친구 초대 코드',
    example: 'AB12CD34',
    maxLength: 20,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  friendInviteCode?: string | null;
}
