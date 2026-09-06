import { ApiProperty } from '@nestjs/swagger';
import { LocaleType } from '../../../../common/enums/locale-type.enum';

/**
 * 오늘의 질문 응답 DTO
 */
export class GetTodayQuestionResponseDto {
  @ApiProperty({ description: '질문 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '질문 시리즈 ID', example: '1' })
  questionSeriesId!: string;

  @ApiProperty({ description: '시리즈 내 순서', example: 1 })
  orderNum!: number;

  @ApiProperty({
    description: '질문 본문 (요청 로케일, 없으면 한국어로 대체)',
    example: '오늘 하루 가장 즐거웠던 순간은 언제였나요?',
  })
  content!: string;

  @ApiProperty({
    description: '실제로 반환된 콘텐츠의 로케일',
    enum: LocaleType,
    example: LocaleType.KO,
  })
  localeType!: LocaleType;
}
