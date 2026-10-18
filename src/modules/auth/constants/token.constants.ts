/** Access Token 만료 시간 (초) — 기본 1시간 */
export const JWT_ACCESS_EXPIRES_IN_SECONDS = 60 * 60;

/** Refresh Token 만료 기간 (일). 갱신할 때마다 새 토큰으로 바뀌고 기간도 다시 시작한다 */
export const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

/** Refresh Token 원문 길이 (바이트) */
export const REFRESH_TOKEN_BYTES = 32;
