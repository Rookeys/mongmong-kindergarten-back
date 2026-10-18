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

  @ApiPropertyOptional({ description: '일지 기본 비공개 여부', example: true })
  @IsOptional()
  @IsBoolean()
  setLetterIsPrivate?: boolean;

  @ApiPropertyOptional({
    description: '일지 SNS 공유 기본 비공개 여부',
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
