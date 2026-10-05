import { ApiProperty } from '@nestjs/swagger';
import { LocaleType } from '../../../../common/enums/locale-type.enum';

/**
 * 질문 리스트 항목 응답 DTO
 */
export class GetQuestionResponseDto {
  @ApiProperty({ description: '질문 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '질문 순번 (1월 1일 = 1, 최대 365)', example: 1 })
  orderNum!: number;

  @ApiProperty({
    description: '질문 본문 (요청 로케일, 없으면 한국어로 대체)',
    example: '기억에 남는 생일은 언제인가요?',
  })
  content!: string;

  @ApiProperty({
    description: '실제로 반환된 콘텐츠의 로케일',
    enum: LocaleType,
    enumName: 'LocaleType',
    example: LocaleType.KO,
  })
  localeType!: LocaleType;
}
