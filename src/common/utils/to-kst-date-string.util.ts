const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 시각을 한국 시간(KST) 기준 날짜 문자열(YYYY-MM-DD)로 변환한다.
 * 하루 1회 제한(출석, 광고), 당일 수정 제한 등 "오늘" 판정의 기준이다.
 */
export const toKstDateString = (date: Date = new Date()): string =>
  new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
