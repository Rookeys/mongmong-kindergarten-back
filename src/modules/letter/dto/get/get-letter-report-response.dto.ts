import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LetterReportReasonType } from '../../enums/letter-report-reason-type.enum';
import { LetterReportStatus } from '../../enums/letter-report-status.enum';

/**
 * 편지 신고 응답 DTO
 */
export class GetLetterReportResponseDto {
  @ApiProperty({ description: '신고 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '편지 ID', example: '1' })
  letterId!: string;

  @ApiProperty({
    description: '신고 사유',
    enum: LetterReportReasonType,
    example: LetterReportReasonType.INAPPROPRIATE,
  })
  reasonType!: LetterReportReasonType;

  @ApiPropertyOptional({
    description: '신고 상세 사유',
    example: null,
    nullable: true,
  })
  reasonDetail!: string | null;

  @ApiProperty({
    description: '처리 상태',
    enum: LetterReportStatus,
    example: LetterReportStatus.PENDING,
  })
  status!: LetterReportStatus;

  @ApiProperty({
    description: '생성 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  createdDate!: Date;
}
