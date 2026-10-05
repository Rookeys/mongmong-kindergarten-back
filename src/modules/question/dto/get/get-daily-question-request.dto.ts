import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, Matches } from 'class-validator';
import { LocaleType } from '../../../../common/enums/locale-type.enum';

/**
 * 날짜별 질문 조회 쿼리 DTO
 */
export class GetDailyQuestionRequestDto {
  @ApiPropertyOptional({
    description: '조회할 날짜 (KST, 미지정 시 오늘. 미래 날짜 불가)',
    example: '2026-05-05',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  date?: string;

  @ApiPropertyOptional({
    description: '콘텐츠 로케일 (미지정 시 한국어)',
    enum: LocaleType,
    enumName: 'LocaleType',
    example: LocaleType.KO,
  })
  @IsOptional()
  @IsEnum(LocaleType)
  locale?: LocaleType;
}
