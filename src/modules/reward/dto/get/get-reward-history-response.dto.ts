import { ApiProperty } from '@nestjs/swagger';
import { RewardType } from '../../enums/reward-type.enum';

/**
 * 리워드 적립 이력 응답 DTO
 */
export class GetRewardHistoryResponseDto {
  @ApiProperty({ description: '리워드 이력 ID', example: '1' })
  id!: string;

  @ApiProperty({
    description: '적립 유형',
    enum: RewardType,
    example: RewardType.AD,
  })
  type!: RewardType;

  @ApiProperty({ description: '적립 수량(꿈조각)', example: 20 })
  amount!: number;

  @ApiProperty({
    description: '생성 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  createdDate!: Date;
}
