import { ApiProperty } from '@nestjs/swagger';

/**
 * AI 답장 응답 DTO
 */
export class GetAiReplyResponseDto {
  @ApiProperty({ description: 'AI 답장 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '편지 ID', example: '1' })
  letterId!: string;

  @ApiProperty({ description: '내용', example: '오늘도 정말 잘했어요!' })
  content!: string;

  @ApiProperty({ description: '읽음 여부', example: false })
  isRead!: boolean;

  @ApiProperty({
    description: '생성 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  createdDate!: Date;
}
