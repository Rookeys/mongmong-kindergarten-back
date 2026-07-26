import { LoginType } from '../../user/enums/login-type.enum';
import { UserStatus } from '../../user/enums/user-status.enum';

/**
 * API 응답 등 외부로 노출할 때 사용하는 사용자 형태(비밀번호 제외)
 */
export type UserWithoutPassword = {
  id: string;
  email: string;
  nickname: string;
  loginType: LoginType;
  providerId: string | null;
  rewardCount: number;
  aiReplyCycle: number;
  myInviteCode: string;
  friendInviteCode: string | null;
  status: UserStatus;
  lastLoginDate: Date | null;
  createdDate: Date;
  updatedDate: Date;
};
