import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { ItemType } from '../../enums/item-type.enum';

/**
 * 아이템 생성 요청 DTO (관리자용)
 */
export class CreateItemRequestDto {
  @ApiProperty({ description: '아이템 이름', example: '왕관', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: '아이템 유형',
    enum: ItemType,
    enumName: 'ItemType',
    example: ItemType.HAT,
  })
  @IsEnum(ItemType)
  itemType!: ItemType;

  @ApiProperty({
    description: '이미지 URL',
    example: 'https://cdn.mongmong.com/items/crown.png',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  imageUrl!: string;

  @ApiProperty({ description: '구매 비용(꿈조각)', example: 100 })
  @IsInt()
  @Min(0)
  cost!: number;
}
