import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 일지(편지) 단건 조회 경로 파라미터 DTO
 */
export class GetLetterRequestDto {
  @ApiProperty({ description: '편지 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
