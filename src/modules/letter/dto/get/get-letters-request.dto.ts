import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * 내 일지 목록 조회 쿼리 DTO
 */
export class GetLettersRequestDto {
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
