import { ApiProperty } from '@nestjs/swagger';
import { AdType } from '../../enums/ad-type.enum';

/**
 * 광고 시청 리워드 응답 DTO
 */
export class CreateAdViewResponseDto {
  @ApiProperty({
    description: '광고 유형',
    enum: AdType,
    enumName: 'AdType',
    example: AdType.REWARDED,
  })
  adType!: AdType;

  @ApiProperty({ description: '시청 일자', example: '2026-07-26' })
  viewDate!: string;

  @ApiProperty({ description: '지급된 리워드 수량(꿈조각)', example: 3 })
  rewardAmount!: number;
}
