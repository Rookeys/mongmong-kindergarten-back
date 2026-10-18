import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 질문 시리즈 생성 요청 DTO (관리자)
 */
export class CreateQuestionSeriesRequestDto {
  @ApiProperty({ description: '시리즈 제목', example: '나를 알아가는 1년' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @ApiPropertyOptional({ description: '설명', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '썸네일 URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;
}
