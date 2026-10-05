/**
 * 리워드 적립 유형 (REWARD_HISTORY.TYPE)
 */
export enum RewardType {
  AD = 'ad',
  INVITE = 'invite',
  LETTER = 'letter',
  ADMIN = 'admin',
  ATTENDANCE = 'attendance',
  STREAK = 'streak',
  /** 지난 날짜 일지 작성에 사용 (amount가 음수) */
  PAST_LETTER = 'past_letter',
}
