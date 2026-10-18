import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { LetterReportStatus } from '../../enums/letter-report-status.enum';

/**
 * 신고 목록 조회 쿼리 DTO (관리자)
 */
export class GetLetterReportsRequestDto {
  @ApiPropertyOptional({
    description: '처리 상태 (생략하면 전체)',
    enum: LetterReportStatus,
    enumName: 'LetterReportStatus',
    example: LetterReportStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(LetterReportStatus)
  status?: LetterReportStatus;

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
