import { MoodType } from '../../enums/mood-type.enum';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 일지 월간 캘린더의 하루치 응답 DTO (일지를 쓴 날만 내려간다)
 */
export class GetLetterCalendarResponseDto {
  @ApiProperty({ description: '일지 날짜 (KST)', example: '2026-05-05' })
  date!: string;

  @ApiProperty({ description: '편지 ID', example: '1' })
  letterId!: string;

  @ApiProperty({
    description:
      '오늘의 기분 (good 기분 좋아, excited 신나, soso 그냥그래, angry 화가 나, sad 슬퍼, depressed 우울해)',
    enum: MoodType,
    enumName: 'MoodType',
    example: MoodType.GOOD,
    nullable: true,
  })
  mood!: MoodType | null;
}
