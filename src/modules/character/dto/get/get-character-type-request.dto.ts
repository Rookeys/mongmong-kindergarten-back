import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 캐릭터 종류 경로 파라미터 DTO
 */
export class GetCharacterTypeRequestDto {
  @ApiProperty({ description: '캐릭터 종류 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
