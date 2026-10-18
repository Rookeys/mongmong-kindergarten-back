import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LocaleType } from '../../../../common/enums/locale-type.enum';

/**
 * 일지(편지) 작성 요청 DTO
 * 질문은 서버가 letterDate(달력 날짜)로 결정한다.
 */
export class CreateLetterRequestDto {
  @ApiPropertyOptional({
    description:
      '일지 날짜 (KST, 미지정 시 오늘). 지난 날짜는 꿈조각 3개가 차감되고 미래 날짜는 쓸 수 없다',
    example: '2026-05-05',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  letterDate?: string;

  @ApiProperty({
    description: '답변 내용',
    example: '오늘은 친구랑 블록 놀이를 해서 정말 즐거웠어요.',
    maxLength: 1000,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  answer!: string;

  @ApiPropertyOptional({
    description: '오늘의 기분 번호',
    example: 1,
    nullable: true,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  moodNumber?: number | null;

  @ApiPropertyOptional({
    description:
      '비공개 여부. 미지정 시 내 설정(setLetterIsPrivate, 마지막 선택)을 따른다. 작성 후 "답장을 공개할까요?"의 선택은 PATCH /letters/:id로 보낸다',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description:
      'SNS 공유 비공개 여부. 미지정 시 내 설정(setLetterIsPrivateSns, 마지막 선택)을 따른다',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrivateSns?: boolean;

  @ApiPropertyOptional({
    description: '작성 로케일 (미지정 시 한국어)',
    enum: LocaleType,
    enumName: 'LocaleType',
    example: LocaleType.KO,
  })
  @IsOptional()
  @IsEnum(LocaleType)
  localeType?: LocaleType;
}
