import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 사용자 단건 조회 경로 파라미터 DTO
 */
export class GetUserRequestDto {
  @ApiProperty({ description: '사용자 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
