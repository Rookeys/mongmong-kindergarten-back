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

  @ApiProperty({
    description:
      '내 일지를 다른 사람에게 보여줄지(false=공개). 작성 후 "답장을 공개할까요?"의 마지막 선택이 저장되고 다음 일지의 기본값이 된다',
    example: false,
  })
  setLetterIsPrivate!: boolean;

  @ApiProperty({
    description:
      '몽몽이가 내 일지를 SNS(인스타그램 피드)에 소개해도 되는지(false=허용). 마지막 선택이 저장되고 다음 일지의 기본값이 된다',
    example: false,
  })
  setLetterIsPrivateSns!: boolean;

  @ApiProperty({ description: '푸시 알림 수신 여부', example: true })
  pushEnabled!: boolean;
}
