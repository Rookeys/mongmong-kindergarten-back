import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { GetUserResponseDto } from '../../user/dto/get/get-user-response.dto';
import { AuthService } from '../auth.service';

/**
 * 로컬 로그인 Passport 전략 (email/password)
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  /**
   * email/password를 검증하고 공개 사용자 정보를 반환한다. 실패 사유는 validateUser가 AppException으로 던진다.
   */
  async validate(email: string, password: string): Promise<GetUserResponseDto> {
    return this.authService.validateUser(email, password);
  }
}
