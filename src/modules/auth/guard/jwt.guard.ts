import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Bearer 토큰 인증 가드
 */
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
