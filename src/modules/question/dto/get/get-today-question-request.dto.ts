import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { LocaleType } from '../../../../common/enums/locale-type.enum';

/**
 * 오늘의 질문 조회 쿼리 DTO
 */
export class GetTodayQuestionRequestDto {
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
