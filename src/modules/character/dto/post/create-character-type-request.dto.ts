import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 캐릭터 종류 생성 요청 DTO (관리자)
 */
export class CreateCharacterTypeRequestDto {
  @ApiProperty({ description: '캐릭터 이름', example: '햄몽이', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({
    description: '이미지 URL',
    example: 'https://cdn.mongmong.com/characters/hammong.png',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;
}
