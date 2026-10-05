import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 캐릭터-아이템 매핑 경로 파라미터 DTO
 */
export class GetCharacterItemRequestDto {
  @ApiProperty({ description: '캐릭터-아이템 매핑 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
