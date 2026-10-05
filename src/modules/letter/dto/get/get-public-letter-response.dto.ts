import { ApiProperty } from '@nestjs/swagger';

/**
 * 휴게실 공개 일지 응답 DTO
 * 익명 공개이므로 작성자 정보는 담지 않는다.
 */
export class GetPublicLetterResponseDto {
  @ApiProperty({ description: '편지 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '질문 ID', example: '1' })
  questionId!: string;

  @ApiProperty({
    description: '답변 내용',
    example: '열 살 생일에 가족이랑 바다에 갔던 날이요.',
  })
  answer!: string;

  @ApiProperty({
    description: '작성 일시',
    example: '2026-05-05T03:00:00.000Z',
    format: 'date-time',
  })
  createdDate!: Date;
}
