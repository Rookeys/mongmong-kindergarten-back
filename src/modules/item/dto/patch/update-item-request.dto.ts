import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { ItemType } from '../../enums/item-type.enum';

/**
 * 아이템 부분 수정 요청 DTO (관리자용)
 */
export class UpdateItemRequestDto {
  @ApiPropertyOptional({ description: '아이템 이름', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: '아이템 유형',
    enum: ItemType,
    enumName: 'ItemType',
  })
  @IsOptional()
  @IsEnum(ItemType)
  itemType?: ItemType;

  @ApiPropertyOptional({ description: '이미지 URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ description: '구매 비용(꿈조각)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({
    description: '판매 중 여부 (판매를 다시 시작할 때 true)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean;
}
