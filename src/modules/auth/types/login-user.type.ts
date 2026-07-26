import { UserWithoutPassword } from './user-without-password.type';

export type LoginUser = Pick<UserWithoutPassword, 'id' | 'email'>;

export type AuthTokenResponse = {
  accessToken: string;
  user: UserWithoutPassword;
};

export type JwtPayload = {
  sub: string;
  email: string;
};
