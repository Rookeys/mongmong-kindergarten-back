import { ApiProperty } from '@nestjs/swagger';

/**
 * 일지 월간 캘린더의 하루치 응답 DTO (일지를 쓴 날만 내려간다)
 */
export class GetLetterCalendarResponseDto {
  @ApiProperty({ description: '일지 날짜 (KST)', example: '2026-05-05' })
  date!: string;

  @ApiProperty({ description: '편지 ID', example: '1' })
  letterId!: string;

  @ApiProperty({
    description: '오늘의 기분 번호',
    example: 1,
    nullable: true,
    type: Number,
  })
  moodNumber!: number | null;
}
