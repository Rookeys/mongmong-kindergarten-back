import { ApiProperty } from '@nestjs/swagger';
import { LocaleType } from '../../../../common/enums/locale-type.enum';

/**
 * 내 설정 응답 DTO
 */
export class GetUserSettingResponseDto {
  @ApiProperty({
    description: '언어',
    enum: LocaleType,
    enumName: 'LocaleType',
    example: LocaleType.KO,
  })
  localeType!: LocaleType;

  @ApiProperty({ description: '일지 기본 비공개 여부', example: false })
  setLetterIsPrivate!: boolean;

  @ApiProperty({
    description: '일지 SNS 공유 기본 비공개 여부',
    example: false,
  })
  setLetterIsPrivateSns!: boolean;

  @ApiProperty({ description: '푸시 알림 수신 여부', example: true })
  pushEnabled!: boolean;
}
