import { ApiProperty } from '@nestjs/swagger';

/**
 * 오늘 출석 여부 응답 DTO
 */
export class GetAttendanceResponseDto {
  @ApiProperty({ description: '오늘 날짜 (KST)', example: '2026-05-05' })
  attendanceDate!: string;

  @ApiProperty({ description: '오늘 출석체크를 했는지 여부', example: false })
  isChecked!: boolean;
}
