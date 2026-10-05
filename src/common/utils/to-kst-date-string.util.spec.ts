import { toKstDateString } from './to-kst-date-string.util';

describe('toKstDateString', () => {
  it('UTC 15시 이전은 같은 날짜다', () => {
    expect(toKstDateString(new Date('2026-05-05T14:59:59Z'))).toBe(
      '2026-05-05',
    );
  });

  it('UTC 15시(KST 자정)부터 다음 날짜다', () => {
    expect(toKstDateString(new Date('2026-05-05T15:00:00Z'))).toBe(
      '2026-05-06',
    );
  });
});
