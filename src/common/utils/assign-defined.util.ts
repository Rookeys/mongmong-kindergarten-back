/**
 * patch에서 undefined가 아닌 값만 target에 덮어쓴다.
 * 요청 DTO 인스턴스는 보내지 않은 필드도 undefined로 갖고 있어서 Object.assign을 그대로 쓰면 기존 값이 지워진다.
 */
export const assignDefined = <T extends object>(
  target: T,
  patch: Partial<T>,
): T =>
  Object.assign(
    target,
    Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ),
  );
