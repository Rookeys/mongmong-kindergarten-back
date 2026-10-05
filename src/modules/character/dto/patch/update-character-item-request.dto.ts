import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * 아이템 장착/해제 요청 DTO
 */
export class UpdateCharacterItemRequestDto {
  @ApiProperty({ description: '장착 여부', example: true })
  @IsBoolean()
  isEquipped!: boolean;
}
