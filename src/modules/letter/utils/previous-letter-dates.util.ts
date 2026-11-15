import { toQuestionOrderNum } from '../../question/utils/to-question-order-num.util';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * today(YYYY-MM-DD) 직전의 일지를 쓸 수 있는 날 count개를 최근 날짜부터 돌려준다.
 * 2월 29일은 질문이 없는 날이라 건너뛴다 (연속 작성에서 하루 무시).
 */
export const getPreviousLetterDates = (
  today: string,
  count: number,
): string[] => {
  const dates: string[] = [];
  let time = Date.parse(`${today}T00:00:00Z`);
  while (dates.length < count) {
    time -= MS_PER_DAY;
    const date = new Date(time).toISOString().slice(0, 10);
    if (toQuestionOrderNum(date) !== null) {
      dates.push(date);
    }
  }
  return dates;
};
