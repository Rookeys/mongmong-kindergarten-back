import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CharacterStatus } from '../../enums/character-status.enum';

/**
 * 캐릭터 응답 DTO
 */
export class GetCharacterResponseDto {
  @ApiProperty({ description: '캐릭터 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '레벨', example: 1 })
  level!: number;

  @ApiProperty({ description: '경험치', example: 0 })
  experience!: number;

  @ApiProperty({
    description: '상태',
    enum: CharacterStatus,
    example: CharacterStatus.GROWING,
  })
  status!: CharacterStatus;

  @ApiPropertyOptional({
    description: '졸업 일시',
    type: String,
    format: 'date-time',
    example: null,
    nullable: true,
  })
  graduatedAt!: Date | null;

  @ApiPropertyOptional({
    description: '마지막 물주기 일시',
    type: String,
    format: 'date-time',
    example: null,
    nullable: true,
  })
  lastWateredAt!: Date | null;

  @ApiProperty({
    description: '생성 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  createdDate!: Date;
}
