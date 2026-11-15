const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** 질문은 365문항 고정이라 평년을 기준으로 순번을 센다 */
const NON_LEAP_YEAR = 2001;

/**
 * 날짜(YYYY-MM-DD)를 질문 순번(1~365)으로 바꾼다. 같은 월/일은 매년 같은 질문이다.
 * 2월 29일은 질문이 없는 날(쉬는 날)이라 null이다.
 */
export const toQuestionOrderNum = (date: string): number | null => {
  const [, month, day] = date.split('-').map(Number);
  if (month === 2 && day === 29) {
    return null;
  }
  return (
    (Date.UTC(NON_LEAP_YEAR, month - 1, day) - Date.UTC(NON_LEAP_YEAR, 0, 1)) /
      MS_PER_DAY +
    1
  );
};
