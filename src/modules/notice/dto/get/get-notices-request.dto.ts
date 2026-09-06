import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { NoticeType } from '../../enums/notice-type.enum';

/**
 * 공지 목록 조회 쿼리 DTO
 * isPublished는 관리자만 유효하며, 일반 사용자는 항상 게시된 공지만 조회한다.
 */
export class GetNoticesRequestDto {
  @ApiPropertyOptional({
    description: '공지 유형으로 필터링',
    enum: NoticeType,
    example: NoticeType.NOTICE,
  })
  @IsOptional()
  @IsEnum(NoticeType)
  type?: NoticeType;

  @ApiPropertyOptional({
    description: '게시 여부로 필터링 (관리자 전용)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
