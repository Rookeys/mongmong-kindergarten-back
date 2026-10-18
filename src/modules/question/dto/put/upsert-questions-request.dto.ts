import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { QUESTION_COUNT_PER_SERIES } from '../../constants/question.constants';
import { QuestionInputDto } from './question-input.dto';

/**
 * 질문 일괄 등록·수정 요청 DTO (관리자)
 */
export class UpsertQuestionsRequestDto {
  @ApiProperty({
    description:
      '등록할 질문. 같은 순번이 이미 있으면 문구를 덮어쓰고, 보내지 않은 순번은 그대로 둔다',
    type: [QuestionInputDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(QUESTION_COUNT_PER_SERIES)
  @ValidateNested({ each: true })
  @Type(() => QuestionInputDto)
  questions!: QuestionInputDto[];
}
