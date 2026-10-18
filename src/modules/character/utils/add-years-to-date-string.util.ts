/**
 * 'YYYY-MM-DD'에 years년을 더한다. 2월 29일에서 평년으로 가면 2월 28일이다.
 */
export const addYearsToDateString = (date: string, years: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const targetYear = year + years;
  const lastDayOfMonth = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  return [
    String(targetYear),
    String(month).padStart(2, '0'),
    String(Math.min(day, lastDayOfMonth)).padStart(2, '0'),
  ].join('-');
};
