import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppException } from '../../../common/app-exception';
import { ErrorCode } from '../../../common/error-code';

/**
 * JWT Bearer 토큰 인증 가드
 * passport-jwt가 알려주는 실패 사유(info)로 토큰 없음/만료/위조를 구분한다.
 */
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser, info?: Error): TUser {
    if (user && !err) {
      return user;
    }
    if (info?.name === 'TokenExpiredError') {
      throw new AppException(ErrorCode.AUTH_TOKEN_EXPIRED);
    }
    if (info?.message === 'No auth token') {
      throw new AppException(ErrorCode.AUTH_TOKEN_MISSING);
    }
    throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
  }
}
