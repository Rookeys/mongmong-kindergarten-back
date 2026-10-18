import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LocaleType } from '../../../../common/enums/locale-type.enum';

/**
 * 질문 한 개의 언어별 문구
 */
export class QuestionContentInputDto {
  @ApiProperty({
    description: '언어',
    enum: LocaleType,
    enumName: 'LocaleType',
    example: LocaleType.KO,
  })
  @IsEnum(LocaleType)
  localeType!: LocaleType;

  @ApiProperty({
    description: '질문 문구',
    example: '기억에 남는 생일은 언제인가요?',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
