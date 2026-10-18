import { addYearsToDateString } from './add-years-to-date-string.util';
import { toLevel } from './to-level.util';
import { toNextCycleStartDate } from './to-next-cycle-start-date.util';

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

describe('toNextCycleStartDate', () => {
  it('졸업일에 졸업하면 다음 캐릭터는 졸업일부터 시작한다', () => {
    expect(toNextCycleStartDate('2026-10-18', '2027-10-18')).toBe('2027-10-18');
  });

  it('졸업을 늦게 하면 지나간 사이클은 건너뛰고 오늘이 속한 사이클 시작일을 쓴다', () => {
    expect(toNextCycleStartDate('2026-10-18', '2029-01-05')).toBe('2028-10-18');
  });
});
