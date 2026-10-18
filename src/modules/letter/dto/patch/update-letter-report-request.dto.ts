import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { LetterReportStatus } from '../../enums/letter-report-status.enum';

/**
 * 신고 처리 상태 변경 요청 DTO (관리자)
 */
export class UpdateLetterReportRequestDto {
  @ApiProperty({
    description:
      '처리 상태. resolved(신고 인정)로 바꾸면 그 일지는 휴게실에서 내려간다',
    enum: LetterReportStatus,
    enumName: 'LetterReportStatus',
    example: LetterReportStatus.RESOLVED,
  })
  @IsEnum(LetterReportStatus)
  status!: LetterReportStatus;
}
