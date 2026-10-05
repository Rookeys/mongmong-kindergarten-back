import { toQuestionOrderNum } from './to-question-order-num.util';

describe('toQuestionOrderNum', () => {
  it('1월 1일은 1번, 12월 31일은 365번이다', () => {
    expect(toQuestionOrderNum('2026-01-01')).toBe(1);
    expect(toQuestionOrderNum('2026-12-31')).toBe(365);
  });

  it('윤년이어도 같은 월/일은 같은 번호다', () => {
    expect(toQuestionOrderNum('2028-03-01')).toBe(
      toQuestionOrderNum('2026-03-01'),
    );
    expect(toQuestionOrderNum('2028-12-31')).toBe(365);
  });

  it('2월 29일은 2월 28일과 같은 번호다', () => {
    expect(toQuestionOrderNum('2028-02-29')).toBe(
      toQuestionOrderNum('2028-02-28'),
    );
  });
});
