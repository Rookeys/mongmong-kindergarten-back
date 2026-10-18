import { QueryFailedError } from 'typeorm';

/** PostgreSQL unique 위반 에러 코드 */
export const PG_UNIQUE_VIOLATION = '23505';

/**
 * DB 유니크 제약 위반인지 확인한다. 동시 요청이 먼저 저장한 경우를 구분할 때 쓴다.
 */
export const isUniqueViolation = (err: unknown): boolean =>
  err instanceof QueryFailedError &&
  (err.driverError as { code?: string } | undefined)?.code ===
    PG_UNIQUE_VIOLATION;
