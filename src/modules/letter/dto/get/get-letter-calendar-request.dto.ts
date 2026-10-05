import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

/**
 * 일지 월간 캘린더 조회 쿼리 DTO
 */
export class GetLetterCalendarRequestDto {
  @ApiProperty({ description: '연도', example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiProperty({ description: '월 (1~12)', example: 5 })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
