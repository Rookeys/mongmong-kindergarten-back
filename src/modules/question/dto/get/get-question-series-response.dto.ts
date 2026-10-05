import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 질문 시리즈 목록 응답 DTO
 */
export class GetQuestionSeriesResponseDto {
  @ApiProperty({ description: '질문 시리즈 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '시리즈 제목', example: '나를 알아가는 질문' })
  title!: string;

  @ApiPropertyOptional({
    description: '시리즈 설명',
    example: null,
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({
    description: '썸네일 이미지 URL',
    example: null,
    nullable: true,
  })
  thumbnailUrl!: string | null;
}
