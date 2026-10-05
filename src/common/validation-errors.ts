import { ValidationError } from 'class-validator';
import { AppException, ValidationErrorItem } from './app-exception';
import { ErrorCode } from './error-code';

// class-validator constraint 키 → 프론트용 코드
const CONSTRAINT_CODE: Record<string, string> = {
  isNotEmpty: 'REQUIRED',
  isDefined: 'REQUIRED',
  isEmail: 'EMAIL_INVALID',
  isString: 'MUST_BE_STRING',
  isBoolean: 'MUST_BE_BOOLEAN',
  isInt: 'MUST_BE_INTEGER',
  isNumber: 'MUST_BE_NUMBER',
  isEnum: 'INVALID_ENUM',
  isUuid: 'INVALID_UUID',
  minLength: 'MIN_LENGTH',
  maxLength: 'MAX_LENGTH',
  min: 'MIN_VALUE',
  max: 'MAX_VALUE',
  whitelistValidation: 'NOT_ALLOWED_FIELD',
};

const CODE_MESSAGE: Record<string, (d?: Record<string, unknown>) => string> = {
  REQUIRED: () => '필수 값입니다.',
  EMAIL_INVALID: () => '이메일 형식이 올바르지 않습니다.',
  MUST_BE_STRING: () => '문자열이어야 합니다.',
  MUST_BE_BOOLEAN: () => 'true 또는 false여야 합니다.',
  MUST_BE_INTEGER: () => '정수여야 합니다.',
  MUST_BE_NUMBER: () => '숫자여야 합니다.',
  INVALID_ENUM: (d) => `허용되지 않은 값입니다. (허용: ${String(d?.allowed)})`,
  INVALID_UUID: () => 'UUID 형식이 올바르지 않습니다.',
  MIN_LENGTH: (d) => `${String(d?.limit)}자 이상이어야 합니다.`,
  MAX_LENGTH: (d) => `${String(d?.limit)}자 이하여야 합니다.`,
  MIN_VALUE: (d) => `${String(d?.limit)} 이상이어야 합니다.`,
  MAX_VALUE: (d) => `${String(d?.limit)} 이하여야 합니다.`,
  NOT_ALLOWED_FIELD: () => '허용되지 않은 필드입니다.',
  INVALID_VALUE: () => '값이 올바르지 않습니다.',
};

// class-validator 기본 메시지에서 한도/허용값 추출 (데코레이터 옵션엔 접근 불가)
function extractDetails(
  code: string,
  rawMessage: string,
): Record<string, unknown> | undefined {
  if (code === 'INVALID_ENUM') {
    const allowed = rawMessage.split('following values:')[1]?.trim();
    return allowed ? { allowed: allowed.split(/,\s*/) } : undefined;
  }
  if (['MIN_LENGTH', 'MAX_LENGTH', 'MIN_VALUE', 'MAX_VALUE'].includes(code)) {
    const limit = rawMessage.match(/-?\d+(\.\d+)?/g)?.pop();
    return limit ? { limit: Number(limit) } : undefined;
  }
  return undefined;
}

function flatten(
  errors: ValidationError[],
  prefix = '',
): ValidationErrorItem[] {
  return errors.flatMap((error) => {
    const field = prefix ? `${prefix}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(
      ([key, rawMessage]) => {
        const code = CONSTRAINT_CODE[key] ?? 'INVALID_VALUE';
        const details = extractDetails(code, rawMessage);
        return {
          field,
          code,
          message: CODE_MESSAGE[code](details),
          ...(details ? { details } : {}),
        };
      },
    );
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

/** ValidationPipe / LocalGuard 공용: 필드별 사유가 담긴 400 예외로 변환 */
export function toValidationException(errors: ValidationError[]): AppException {
  const items = flatten(errors);
  const first = items[0];
  const summary = first
    ? `${first.field}: ${first.message}${items.length > 1 ? ` 외 ${items.length - 1}건` : ''}`
    : '';
  return new AppException(
    ErrorCode.VALIDATION_FAILED,
    undefined,
    items,
    summary ? `요청 값이 올바르지 않습니다. (${summary})` : undefined,
  );
}
