import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * 휴게실(다른 사람이 쓴 공개 일지) 목록 조회 쿼리 DTO
 */
export class GetPublicLettersRequestDto {
  @ApiProperty({ description: '질문 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiPropertyOptional({ description: '조회 개수', example: 20, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @ApiPropertyOptional({ description: '건너뛸 개수', example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}
