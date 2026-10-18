import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { LocaleType } from '../../../../common/enums/locale-type.enum';

/**
 * 내 설정 부분 수정 요청 DTO
 */
export class UpdateUserSettingRequestDto {
  @ApiPropertyOptional({
    description: '언어',
    enum: LocaleType,
    enumName: 'LocaleType',
    example: LocaleType.KO,
  })
  @IsOptional()
  @IsEnum(LocaleType)
  localeType?: LocaleType;

  @ApiPropertyOptional({
    description:
      '내 일지를 다른 사람에게 보여줄지(false=공개). 작성 후 "답장을 공개할까요?"의 마지막 선택이 저장되고 다음 일지의 기본값이 된다',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  setLetterIsPrivate?: boolean;

  @ApiPropertyOptional({
    description:
      '몽몽이가 내 일지를 SNS(인스타그램 피드)에 소개해도 되는지(false=허용). 마지막 선택이 저장되고 다음 일지의 기본값이 된다',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  setLetterIsPrivateSns?: boolean;

  @ApiPropertyOptional({ description: '푸시 알림 수신 여부', example: false })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;
}
