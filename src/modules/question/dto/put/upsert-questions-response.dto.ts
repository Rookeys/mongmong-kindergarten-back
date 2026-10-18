import { ApiProperty } from '@nestjs/swagger';

/**
 * 질문 일괄 등록·수정 결과 DTO
 */
export class UpsertQuestionsResponseDto {
  @ApiProperty({ description: '시리즈 ID', example: '1' })
  questionSeriesId!: string;

  @ApiProperty({ description: '이번에 등록·수정한 질문 수', example: 365 })
  upsertedCount!: number;

  @ApiProperty({
    description:
      '아직 질문이 없는 순번 (비어 있으면 그 날짜에 GET /questions/daily가 실패한다)',
    example: [],
    type: [Number],
  })
  missingOrderNums!: number[];
}
