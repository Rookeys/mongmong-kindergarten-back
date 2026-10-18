import { MoodType } from '../../enums/mood-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { LocaleType } from '../../../../common/enums/locale-type.enum';

/**
 * 일지(편지) 응답 DTO
 */
export class GetLetterResponseDto {
  @ApiProperty({ description: '편지 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '질문 ID', example: '1' })
  questionId!: string;

  @ApiProperty({ description: '일지 날짜 (KST)', example: '2026-05-05' })
  letterDate!: string;

  @ApiProperty({
    description: '답변 내용',
    example: '오늘은 친구랑 블록 놀이를 해서 정말 즐거웠어요.',
  })
  answer!: string;

  @ApiProperty({
    description:
      '오늘의 기분 (good 기분 좋아, excited 신나, soso 그냥그래, angry 화가 나, sad 슬퍼, depressed 우울해)',
    enum: MoodType,
    enumName: 'MoodType',
    example: MoodType.GOOD,
    nullable: true,
  })
  mood!: MoodType | null;

  @ApiProperty({ description: '비공개 여부', example: false })
  isPrivate!: boolean;

  @ApiProperty({ description: 'SNS 공유 비공개 여부', example: false })
  isPrivateSns!: boolean;

  @ApiProperty({
    description: '작성 로케일',
    enum: LocaleType,
    enumName: 'LocaleType',
    example: LocaleType.KO,
  })
  localeType!: LocaleType;

  @ApiProperty({
    description: '생성 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  createdDate!: Date;

  @ApiProperty({
    description: '수정 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  updatedDate!: Date;
}
