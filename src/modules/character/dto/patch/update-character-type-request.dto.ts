import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * 캐릭터 종류 부분 수정 요청 DTO (관리자)
 */
export class UpdateCharacterTypeRequestDto {
  @ApiPropertyOptional({
    description: '캐릭터 이름',
    example: '햄몽이',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: '이미지 URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({
    description: '새 캐릭터 배정 대상 여부',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
