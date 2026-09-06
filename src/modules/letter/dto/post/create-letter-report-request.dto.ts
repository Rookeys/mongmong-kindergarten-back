import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LetterReportReasonType } from '../../enums/letter-report-reason-type.enum';

/**
 * 편지 신고 요청 DTO
 */
export class CreateLetterReportRequestDto {
  @ApiProperty({
    description: '신고 사유',
    enum: LetterReportReasonType,
    enumName: 'LetterReportReasonType',
    example: LetterReportReasonType.INAPPROPRIATE,
  })
  @IsEnum(LetterReportReasonType)
  reasonType!: LetterReportReasonType;

  @ApiPropertyOptional({
    description: '신고 상세 사유',
    example: '부적절한 표현이 포함되어 있어요.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonDetail?: string;
}
