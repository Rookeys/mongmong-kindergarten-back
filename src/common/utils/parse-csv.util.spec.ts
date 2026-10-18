import { parseCsv } from './parse-csv.util';

describe('parseCsv', () => {
  it('따옴표 안의 쉼표·줄바꿈·큰따옴표를 그대로 읽고 빈 줄은 건너뛴다', () => {
    const input =
      '\uFEFForder_num,locale_type,content\r\n1,ko,"안녕, ""몽몽""\n두 줄"\n\n2,ko,그냥\n';

    const actual = parseCsv(input);

    expect(actual).toEqual([
      ['order_num', 'locale_type', 'content'],
      ['1', 'ko', '안녕, "몽몽"\n두 줄'],
      ['2', 'ko', '그냥'],
    ]);
  });
});
