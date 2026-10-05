import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * AI 답장 읽음 처리 경로 파라미터 DTO
 */
export class GetAiReplyRequestDto {
  @ApiProperty({ description: 'AI 답장 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
