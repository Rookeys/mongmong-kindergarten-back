import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AdType } from '../../enums/ad-type.enum';

/**
 * 광고 시청 리워드 요청 DTO
 */
export class CreateAdViewRequestDto {
  @ApiProperty({
    description: '광고 유형 (기록용, 유형과 무관하게 리워드 지급)',
    enum: AdType,
    enumName: 'AdType',
    example: AdType.REWARDED,
  })
  @IsEnum(AdType)
  adType!: AdType;
}
