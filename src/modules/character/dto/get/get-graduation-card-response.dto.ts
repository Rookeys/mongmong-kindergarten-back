import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({ description: '졸업 시점 레벨', example: 5 })
  levelSnapshot!: number;

  @ApiPropertyOptional({
    description: '졸업 시점 장착 아이템 스냅샷',
    example: null,
    nullable: true,
  })
  equippedItemsSnapshot!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: '카드 이미지 URL',
    example: null,
    nullable: true,
  })
  cardImageUrl!: string | null;
}
