import { ApiPropertyOptional } from '@nestjs/swagger';
import { MoodType } from '../../enums/mood-type.enum';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * 일지(편지) 부분 수정 요청 DTO
 * answer는 작성 당일에만 수정할 수 있고, 나머지는 언제든 바꿀 수 있다.
 */
export class UpdateLetterRequestDto {
  @ApiPropertyOptional({
    description: '답변 내용 (작성 당일에만 수정 가능)',
    example: '다시 생각해보니 열 살 생일이 제일 기억에 남아요.',
    maxLength: 1000,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  answer?: string;

  @ApiPropertyOptional({
    description:
      '오늘의 기분 (good 기분 좋아, excited 신나, soso 그냥그래, angry 화가 나, sad 슬퍼, depressed 우울해)',
    enum: MoodType,
    enumName: 'MoodType',
    example: MoodType.GOOD,
  })
  @IsOptional()
  @IsEnum(MoodType)
  mood?: MoodType;

  @ApiPropertyOptional({
    description:
      '비공개 여부 (false면 휴게실에 익명으로 공개). 보내면 내 설정 setLetterIsPrivate도 같은 값으로 바뀐다',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description:
      'SNS 공유 비공개 여부. 보내면 내 설정 setLetterIsPrivateSns도 같은 값으로 바뀐다',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrivateSns?: boolean;
}
