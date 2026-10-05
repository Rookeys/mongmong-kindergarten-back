import { ApiProperty } from '@nestjs/swagger';
import { GetLetterResponseDto } from '../get/get-letter-response.dto';

/**
 * 일지(편지) 작성 응답 DTO
 */
export class CreateLetterResponseDto extends GetLetterResponseDto {
  @ApiProperty({
    description:
      '이번 작성으로 바뀐 꿈조각 수량 (오늘 일지 +1, 연속 5일째 +6, 지난 날짜 일지 -3). 친구 초대 보상은 포함하지 않는다',
    example: 1,
  })
  rewardAmount!: number;
}
