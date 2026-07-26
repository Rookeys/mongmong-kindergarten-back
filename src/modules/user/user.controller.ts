import { Controller } from '@nestjs/common';

/**
 * 사용자 도메인 컨트롤러
 * 인증이 필요한 프로필 API는 AuthController에 둔다 (모듈 순환 의존 방지).
 */
@Controller('users')
export class UserController {}
