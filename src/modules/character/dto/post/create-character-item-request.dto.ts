import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 아이템 구매 요청 DTO
 */
export class CreateCharacterItemRequestDto {
  @ApiProperty({ description: '구매할 아이템 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  itemId!: string;
}
