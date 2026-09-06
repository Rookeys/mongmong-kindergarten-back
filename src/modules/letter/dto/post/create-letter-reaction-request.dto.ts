import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { LetterReactionType } from '../../enums/letter-reaction-type.enum';

/**
 * 편지 반응(스티커) 등록 요청 DTO
 */
export class CreateLetterReactionRequestDto {
  @ApiProperty({
    description: '반응 유형',
    enum: LetterReactionType,
    example: LetterReactionType.LIKE,
  })
  @IsEnum(LetterReactionType)
  reactionType!: LetterReactionType;
}
