import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '../../enums/user-status.enum';

/**
 * 사용자 목록 조회 쿼리 DTO
 */
export class GetUsersRequestDto {
  @ApiPropertyOptional({
    description: '계정 상태로 필터링',
    enum: UserStatus,
    enumName: 'UserStatus',
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
