import { ApiProperty } from '@nestjs/swagger';

/**
 * 캐릭터 종류 응답 DTO
 */
export class GetCharacterTypeResponseDto {
  @ApiProperty({ description: '캐릭터 종류 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '캐릭터 이름', example: '햄몽이' })
  name!: string;

  @ApiProperty({
    description: '이미지 URL',
    example: 'https://cdn.mongmong.com/characters/hammong.png',
    nullable: true,
    type: String,
  })
  imageUrl!: string | null;

  @ApiProperty({
    description:
      '새 캐릭터 배정 대상 여부 (false면 더 이상 새로 배정하지 않음)',
    example: true,
  })
  isActive!: boolean;
}
