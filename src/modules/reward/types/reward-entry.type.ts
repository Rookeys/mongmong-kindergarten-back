import { RewardType } from '../enums/reward-type.enum';

/** 리워드 지급/차감 1건 (차감은 amount가 음수) */
export type RewardEntry = {
  type: RewardType;
  amount: number;
};
