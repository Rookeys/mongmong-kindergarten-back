import { ApiProperty } from '@nestjs/swagger';
import { MoodType } from '../../../letter/enums/mood-type.enum';

/**
 * 졸업 카드 응답 DTO
 */
export class GetGraduationCardResponseDto {
  @ApiProperty({ description: '졸업 카드 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '캐릭터 ID', example: '1' })
  characterId!: string;

  @ApiProperty({
    description: '졸업 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  graduatedAt!: Date;

  @ApiProperty({ description: '졸업 시점 레벨', example: 4 })
  levelSnapshot!: number;

  @ApiProperty({ description: '캐릭터 이름', example: '햄몽이' })
  characterName!: string;

  @ApiProperty({ description: '사이클 동안 보낸 편지 수', example: 234 })
  letterCount!: number;

  @ApiProperty({
    description: '가장 많이 보낸 기분 (기분을 고른 편지가 없으면 null)',
    enum: MoodType,
    enumName: 'MoodType',
    example: MoodType.GOOD,
    nullable: true,
  })
  topMood!: MoodType | null;

  @ApiProperty({ description: '사이클 시작일 (KST)', example: '2025-10-18' })
  periodStart!: string | null;

  @ApiProperty({ description: '사이클 마지막 날 (KST)', example: '2026-10-17' })
  periodEnd!: string | null;

  @ApiProperty({
    description: '졸업 시점 장착 아이템 스냅샷',
    example: null,
    nullable: true,
    type: Object,
  })
  equippedItemsSnapshot!: Record<string, unknown> | null;

  @ApiProperty({
    description: '카드 이미지 URL',
    example: null,
    nullable: true,
    type: String,
  })
  cardImageUrl!: string | null;
}
