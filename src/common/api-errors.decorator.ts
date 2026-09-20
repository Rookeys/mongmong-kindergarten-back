import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiResponse } from '@nestjs/swagger';
import { ERROR_META, ErrorCode } from './error-code';

export class ValidationErrorItemDto {
  @ApiProperty({ description: '오류가 난 필드 (중첩은 a.b)', example: 'email' })
  field!: string;

  @ApiProperty({ description: '규칙 단위 사유 코드', example: 'EMAIL_INVALID' })
  code!: string;

  @ApiProperty({ example: '이메일 형식이 올바르지 않습니다.' })
  message!: string;

  @ApiPropertyOptional({
    description: '부가정보 (MIN_LENGTH: {limit}, INVALID_ENUM: {allowed[]} 등)',
    type: 'object',
    additionalProperties: true,
  })
  details?: Record<string, unknown>;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/character-items' })
  path!: string;

  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    enum: ErrorCode,
    enumName: 'ErrorCode',
    description: '프론트 분기용 에러 코드',
  })
  code!: ErrorCode;

  @ApiProperty({ example: '리워드(꿈조각)가 부족합니다.' })
  message!: string;

  @ApiPropertyOptional({
    description:
      '사유별 부가정보 (예: REWARD_INSUFFICIENT → {required, current})',
    type: 'object',
    additionalProperties: true,
  })
  details?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: [ValidationErrorItemDto],
    description: 'VALIDATION_FAILED일 때 필드별 사유',
  })
  errors?: ValidationErrorItemDto[];
}

/**
 * 엔드포인트가 던질 수 있는 에러 코드를 상태코드별로 묶어 Swagger에 문서화한다.
 */
export function ApiErrors(...codes: ErrorCode[]) {
  const byStatus = new Map<number, ErrorCode[]>();
  for (const code of codes) {
    const status = ERROR_META[code].status;
    byStatus.set(status, [...(byStatus.get(status) ?? []), code]);
  }
  return applyDecorators(
    ...[...byStatus].map(([status, list]) =>
      ApiResponse({
        status,
        type: ErrorResponseDto,
        description: list
          .map((code) => `- \`${code}\`: ${ERROR_META[code].message}`)
          .join('\n'),
      }),
    ),
  );
}
