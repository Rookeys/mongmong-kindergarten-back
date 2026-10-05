import { HttpException } from '@nestjs/common';
import { ERROR_META, ErrorCode } from './error-code';

export interface ValidationErrorItem {
  field: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 에러 코드 기반 예외. status/기본 메시지는 ERROR_META에서 가져온다.
 * details: 프론트가 사유별 UI를 그릴 때 쓰는 부가정보 (예: {required, current}).
 * message: 케이스별 상세 한글 문구. 생략하면 코드의 기본 문구를 쓴다.
 */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    readonly details?: Record<string, unknown>,
    readonly errors?: ValidationErrorItem[],
    message?: string,
  ) {
    super(message ?? ERROR_META[code].message, ERROR_META[code].status);
  }

  /**
   * 대상 식별값을 details와 메시지 끝 "(key: value)"에 함께 담는다.
   * 예: 일지를 찾을 수 없습니다. (letterId: 12)
   */
  static withTarget(
    code: ErrorCode,
    target: Record<string, string | number>,
  ): AppException {
    const suffix = Object.entries(target)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    return new AppException(
      code,
      target,
      undefined,
      `${ERROR_META[code].message} (${suffix})`,
    );
  }
}
