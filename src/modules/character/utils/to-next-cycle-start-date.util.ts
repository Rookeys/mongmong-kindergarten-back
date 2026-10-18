import { CHARACTER_CYCLE_YEARS } from '../constants/character-growth.constants';
import { addYearsToDateString } from './add-years-to-date-string.util';

/**
 * 졸업한 캐릭터 다음 캐릭터의 시작일. 사이클은 날짜 기준으로 계속 돌기 때문에
 * 졸업을 늦게 해도 그 사이 지나간 사이클은 건너뛰고, 오늘이 속한 사이클의 시작일(가장 최근 기념일)을 쓴다.
 */
export const toNextCycleStartDate = (
  previousCycleStartDate: string,
  today: string,
): string => {
  let cycleStartDate = addYearsToDateString(
    previousCycleStartDate,
    CHARACTER_CYCLE_YEARS,
  );
  let nextCycleStartDate = addYearsToDateString(
    cycleStartDate,
    CHARACTER_CYCLE_YEARS,
  );
  while (nextCycleStartDate <= today) {
    cycleStartDate = nextCycleStartDate;
    nextCycleStartDate = addYearsToDateString(
      cycleStartDate,
      CHARACTER_CYCLE_YEARS,
    );
  }
  return cycleStartDate;
};
