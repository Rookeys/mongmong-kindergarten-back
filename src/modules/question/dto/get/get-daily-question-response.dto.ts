import { ApiProperty } from '@nestjs/swagger';
import { LocaleType } from '../../../../common/enums/locale-type.enum';

/**
 * 날짜별 질문 응답 DTO
 */
export class GetDailyQuestionResponseDto {
  @ApiProperty({ description: '질문 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '질문 시리즈 ID', example: '1' })
  questionSeriesId!: string;

  @ApiProperty({
    description: '질문 순번 (1월 1일 = 1, 최대 365)',
    example: 125,
  })
  orderNum!: number;

  @ApiProperty({ description: '질문 날짜 (KST)', example: '2026-05-05' })
  date!: string;

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

  @ApiProperty({
    description: '이 날짜에 내가 쓴 일지 ID (아직 안 썼거나 비회원이면 null)',
    example: null,
    nullable: true,
    type: String,
  })
  letterId!: string | null;
}
