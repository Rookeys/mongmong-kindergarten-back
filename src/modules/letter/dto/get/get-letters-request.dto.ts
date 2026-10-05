import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * 내 일지 목록 조회 쿼리 DTO
 */
export class GetLettersRequestDto {
  @ApiPropertyOptional({
    description: '질문 ID (같은 질문에 쓴 이전 기록만 조회)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  questionId?: string;

  @ApiPropertyOptional({ description: '조회 개수', example: 20, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @ApiPropertyOptional({ description: '건너뛸 개수', example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}
