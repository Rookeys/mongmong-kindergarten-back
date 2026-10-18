import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { QUESTION_COUNT_PER_SERIES } from '../../constants/question.constants';
import { QuestionContentInputDto } from './question-content-input.dto';

/**
 * 등록할 질문 한 개 (날짜 순번 + 언어별 문구)
 */
export class QuestionInputDto {
  @ApiProperty({
    description: '날짜 순번 (1월 1일 = 1 ~ 12월 31일 = 365)',
    example: 1,
    minimum: 1,
    maximum: QUESTION_COUNT_PER_SERIES,
  })
  @IsInt()
  @Min(1)
  @Max(QUESTION_COUNT_PER_SERIES)
  orderNum!: number;

  @ApiProperty({ type: [QuestionContentInputDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionContentInputDto)
  contents!: QuestionContentInputDto[];
}
