import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 공지 단건 조회/수정/삭제 경로 파라미터 DTO
 */
export class GetNoticeRequestDto {
  @ApiProperty({ description: '공지 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
