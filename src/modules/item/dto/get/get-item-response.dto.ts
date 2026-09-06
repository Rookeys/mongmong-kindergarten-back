import { ApiProperty } from '@nestjs/swagger';
import { ItemType } from '../../enums/item-type.enum';

/**
 * 아이템 응답 DTO
 */
export class GetItemResponseDto {
  @ApiProperty({ description: '아이템 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: '아이템 이름', example: '왕관' })
  name!: string;

  @ApiProperty({
    description: '아이템 유형',
    enum: ItemType,
    example: ItemType.HAT,
  })
  itemType!: ItemType;

  @ApiProperty({
    description: '이미지 URL',
    example: 'https://cdn.mongmong.com/items/crown.png',
  })
  imageUrl!: string;

  @ApiProperty({ description: '구매 비용(꿈조각)', example: 100 })
  cost!: number;

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
