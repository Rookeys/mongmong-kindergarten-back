import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ToBoolean } from '../../../../common/decorators/to-boolean.decorator';
import { ItemType } from '../../enums/item-type.enum';

/**
 * 아이템 목록 조회 쿼리 DTO
 * isOnSale은 관리자만 유효하며, 일반 사용자는 항상 판매 중인 아이템만 조회한다.
 */
export class GetItemsRequestDto {
  @ApiPropertyOptional({
    description: '아이템 유형(꾸미기 탭)으로 필터링',
    enum: ItemType,
    enumName: 'ItemType',
    example: ItemType.CLOTHES,
  })
  @IsOptional()
  @IsEnum(ItemType)
  itemType?: ItemType;

  @ApiPropertyOptional({
    description: '판매 여부로 필터링 (관리자 전용, 생략하면 전체)',
    example: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isOnSale?: boolean;
}
