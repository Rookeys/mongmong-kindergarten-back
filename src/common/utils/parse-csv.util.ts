/**
 * CSV 텍스트를 행 배열로 바꾼다(RFC 4180). 큰따옴표로 감싼 칸 안의 쉼표·줄바꿈·"" 이스케이프를 처리한다.
 * 빈 줄은 건너뛴다. 맨 앞 BOM은 지운다.
 */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let isQuoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (isQuoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        isQuoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      isQuoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') {
        i += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((cells) => cells.some((value) => value.trim() !== ''));
};
