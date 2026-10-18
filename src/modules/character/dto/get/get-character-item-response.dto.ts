import { ApiProperty } from '@nestjs/swagger';
import { ItemType } from '../../../item/enums/item-type.enum';

/**
 * 보유 아이템(캐릭터-아이템) 응답 DTO
 */
export class GetCharacterItemResponseDto {
  @ApiProperty({ description: '캐릭터-아이템 매핑 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '아이템 ID', example: '1' })
  itemId!: string;

  @ApiProperty({ description: '아이템 이름', example: '왕관' })
  itemName!: string;

  @ApiProperty({
    description: '아이템 유형',
    enum: ItemType,
    enumName: 'ItemType',
    example: ItemType.CLOTHES,
  })
  itemType!: ItemType;

  @ApiProperty({
    description: '이미지 URL',
    example: 'https://cdn.mongmong.com/items/crown.png',
  })
  imageUrl!: string;

  @ApiProperty({ description: '장착 여부', example: false })
  isEquipped!: boolean;

  @ApiProperty({
    description: '구매 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  createdDate!: Date;
}
