import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NoticeType } from '../../enums/notice-type.enum';

/**
 * 공지 생성 요청 DTO (관리자용)
 */
export class CreateNoticeRequestDto {
  @ApiProperty({
    description: '공지 유형',
    enum: NoticeType,
    example: NoticeType.NOTICE,
  })
  @IsEnum(NoticeType)
  type!: NoticeType;

  @ApiProperty({
    description: '제목',
    example: '앱 업데이트 안내',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: '본문',
    example: '이번 업데이트에서는 꾸미기 기능이 추가되었어요.',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    description: '게시 여부',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
