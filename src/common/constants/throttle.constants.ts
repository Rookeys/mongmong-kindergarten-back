const ONE_MINUTE_MS = 60 * 1000;

/** 기본 요청 제한: IP당 1분에 120회 */
export const DEFAULT_THROTTLE = { ttl: ONE_MINUTE_MS, limit: 120 };

/** 로그인·가입·토큰 갱신처럼 대입 공격 대상이 되는 API: IP당 1분에 10회 */
export const AUTH_THROTTLE = { default: { ttl: ONE_MINUTE_MS, limit: 10 } };

/** 재화가 걸린 쓰기 API(광고 보상, 일지 작성): IP당 1분에 20회 */
export const REWARD_THROTTLE = { default: { ttl: ONE_MINUTE_MS, limit: 20 } };
