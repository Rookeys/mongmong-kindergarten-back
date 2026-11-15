import { getPreviousLetterDates } from './previous-letter-dates.util';

describe('getPreviousLetterDates', () => {
  it('직전 날짜들을 최근 날짜부터 돌려준다', () => {
    expect(getPreviousLetterDates('2026-03-05', 4)).toEqual([
      '2026-03-04',
      '2026-03-03',
      '2026-03-02',
      '2026-03-01',
    ]);
  });

  it('윤년 2월 29일은 건너뛴다', () => {
    expect(getPreviousLetterDates('2028-03-02', 4)).toEqual([
      '2028-03-01',
      '2028-02-28',
      '2028-02-27',
      '2028-02-26',
    ]);
  });
});
