import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NoticeType } from '../../enums/notice-type.enum';

/**
 * 공지 부분 수정 요청 DTO (관리자용)
 */
export class UpdateNoticeRequestDto {
  @ApiPropertyOptional({
    description: '공지 유형',
    enum: NoticeType,
    enumName: 'NoticeType',
  })
  @IsOptional()
  @IsEnum(NoticeType)
  type?: NoticeType;

  @ApiPropertyOptional({ description: '제목', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '본문' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '게시 여부' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
