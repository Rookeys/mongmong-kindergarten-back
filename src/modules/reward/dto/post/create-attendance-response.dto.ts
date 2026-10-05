import { ApiProperty } from '@nestjs/swagger';

/**
 * 출석체크 응답 DTO
 */
export class CreateAttendanceResponseDto {
  @ApiProperty({ description: '출석 일자 (KST)', example: '2026-05-05' })
  attendanceDate!: string;

  @ApiProperty({ description: '지급된 리워드 수량(꿈조각)', example: 1 })
  rewardAmount!: number;
}
