import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LocaleType } from '../../../../common/enums/locale-type.enum';

/**
 * 일지(편지) 작성 요청 DTO
 * questionId는 서버가 사용자의 진행 중인 질문(currentQuestionId)으로 자동 결정한다.
 */
export class CreateLetterRequestDto {
  @ApiProperty({
    description: '답변 내용',
    example: '오늘은 친구랑 블록 놀이를 해서 정말 즐거웠어요.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  answer!: string;

  @ApiPropertyOptional({
    description: '오늘의 기분 번호',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  moodNumber?: number | null;

  @ApiPropertyOptional({ description: '비공개 여부', example: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: 'SNS 공유 비공개 여부', example: false })
  @IsOptional()
  @IsBoolean()
  isPrivateSns?: boolean;

  @ApiPropertyOptional({
    description: '작성 로케일 (미지정 시 한국어)',
    enum: LocaleType,
    example: LocaleType.KO,
  })
  @IsOptional()
  @IsEnum(LocaleType)
  localeType?: LocaleType;
}
