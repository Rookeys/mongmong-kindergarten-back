import { ApiProperty } from '@nestjs/swagger';
import { LetterReactionType } from '../../enums/letter-reaction-type.enum';

/**
 * 편지 반응(스티커) 응답 DTO
 */
export class GetLetterReactionResponseDto {
  @ApiProperty({ description: '반응 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '편지 ID', example: '1' })
  letterId!: string;

  @ApiProperty({
    description: '반응 유형',
    enum: LetterReactionType,
    enumName: 'LetterReactionType',
    example: LetterReactionType.LIKE,
  })
  reactionType!: LetterReactionType;

  @ApiProperty({
    description: '생성 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  createdDate!: Date;
}
