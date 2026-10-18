import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 질문 시리즈 경로 파라미터 DTO
 */
export class GetQuestionSeriesRequestDto {
  @ApiProperty({ description: '질문 시리즈 ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
