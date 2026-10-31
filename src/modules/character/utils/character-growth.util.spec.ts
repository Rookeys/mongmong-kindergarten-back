import { addYearsToDateString } from './add-years-to-date-string.util';
import { toLevel } from './to-level.util';

describe('addYearsToDateString', () => {
  it('같은 월/일의 다음 해다', () => {
    expect(addYearsToDateString('2026-10-18', 1)).toBe('2027-10-18');
  });

  it('2월 29일에서 평년으로 가면 2월 28일이다', () => {
    expect(addYearsToDateString('2028-02-29', 1)).toBe('2029-02-28');
  });
});

describe('toLevel', () => {
  it('90통마다 한 레벨씩 오르고 Lv4가 최대다', () => {
    const cases: [number, number][] = [
      [0, 1],
      [89, 1],
      [90, 2],
      [179, 2],
      [180, 3],
      [270, 4],
      [365, 4],
    ];

    expect(cases.map(([count]) => toLevel(count))).toEqual(
      cases.map(([, level]) => level),
    );
  });
});
