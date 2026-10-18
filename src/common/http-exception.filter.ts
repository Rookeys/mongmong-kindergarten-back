import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppException } from './app-exception';
import { ERROR_META, ErrorCode } from './error-code';

// Nest 기본 예외(코드 미지정)를 상태코드 기반 공통 코드로 매핑
const STATUS_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.TOO_MANY_REQUESTS,
};

// PostgreSQL 에러 코드
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

interface ErrorBody {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  errors?: AppException['errors'];
}

/**
 * 모든 예외를 { success, timestamp, path, statusCode, code, message, details?, errors? } 로 통일한다.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const body = this.toBody(exception);

    if (body.statusCode >= 500) {
      this.logger.error(exception);
    }

    response.status(body.statusCode).json({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...body,
    });
  }

  private toBody(exception: unknown): ErrorBody {
    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
        errors: exception.errors,
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code =
        STATUS_CODE[status] ??
        (status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST);
      // Nest/passport 기본 영문 메시지는 버리고 한글 기본 문구를 쓴다.
      return { statusCode: status, code, message: ERROR_META[code].message };
    }
    if (exception instanceof QueryFailedError) {
      const pgCode = (exception.driverError as { code?: string } | undefined)
        ?.code;
      if (pgCode === PG_UNIQUE_VIOLATION) {
        return this.fromCode(ErrorCode.DUPLICATE_RESOURCE);
      }
      if (pgCode === PG_FOREIGN_KEY_VIOLATION) {
        return this.fromCode(ErrorCode.RESOURCE_IN_USE);
      }
    }
    // 미분류 에러는 내부 정보를 노출하지 않는다.
    return this.fromCode(ErrorCode.INTERNAL_ERROR);
  }

  private fromCode(code: ErrorCode): ErrorBody {
    return {
      statusCode: ERROR_META[code].status,
      code,
      message: ERROR_META[code].message,
    };
  }
}
