import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 아이템 단건 조회/수정/삭제 경로 파라미터 DTO
 */
export class GetItemRequestDto {
  @ApiProperty({ description: '아이템 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
