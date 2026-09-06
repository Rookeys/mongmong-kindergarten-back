import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ItemType } from '../../enums/item-type.enum';

/**
 * 아이템 목록 조회 쿼리 DTO
 */
export class GetItemsRequestDto {
  @ApiPropertyOptional({
    description: '아이템 유형으로 필터링',
    enum: ItemType,
    example: ItemType.HAT,
  })
  @IsOptional()
  @IsEnum(ItemType)
  itemType?: ItemType;
}
