import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 로컬(username/password) 인증 가드
 */
@Injectable()
export class LocalGuard extends AuthGuard('local') {}
