import { ApiProperty } from '@nestjs/swagger';
import { NoticeType } from '../../enums/notice-type.enum';

/**
 * 공지 응답 DTO
 */
export class GetNoticeResponseDto {
  @ApiProperty({ description: '공지 ID', example: '1' })
  id!: string;

  @ApiProperty({
    description: '공지 유형',
    enum: NoticeType,
    enumName: 'NoticeType',
    example: NoticeType.NOTICE,
  })
  type!: NoticeType;

  @ApiProperty({ description: '제목', example: '앱 업데이트 안내' })
  title!: string;

  @ApiProperty({
    description: '본문',
    example: '이번 업데이트에서는 꾸미기 기능이 추가되었어요.',
  })
  content!: string;

  @ApiProperty({ description: '게시 여부', example: true })
  isPublished!: boolean;

  @ApiProperty({
    description: '생성 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  createdDate!: Date;

  @ApiProperty({
    description: '수정 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  updatedDate!: Date;
}
