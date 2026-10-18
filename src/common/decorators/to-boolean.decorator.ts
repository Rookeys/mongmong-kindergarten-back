import { Transform } from 'class-transformer';

/**
 * 쿼리 문자열 'true'/'false'를 boolean으로 바꾼다.
 * 전역 enableImplicitConversion은 'false'도 Boolean('false') = true로 바꾸므로 boolean 쿼리 필드에는 이걸 붙인다.
 */
export const ToBoolean = (): PropertyDecorator =>
  Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = obj[key];
    if (raw === 'true') {
      return true;
    }
    if (raw === 'false') {
      return false;
    }
    return raw;
  });
