import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/login-user.type';

/**
 * JWT Bearer 토큰 Passport 전략
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JwtStrategy.resolveJwtSecret(configService),
    });
  }

  /**
   * 토큰 payload를 request.user에 그대로 전달한다.
   */
  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }

  private static resolveJwtSecret(configService: ConfigService): string {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined.');
    }
    return jwtSecret;
  }
}
