import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginRequestDto } from '../dto/login-request.dto';

/**
 * 로컬(username/password) 인증 가드
 * Nest 실행 순서(Guard -> Pipe)상 ValidationPipe보다 먼저 돌기 때문에,
 * Passport 인증을 타기 전에 직접 바디 유효성 검사를 수행한다.
 */
@Injectable()
export class LocalGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const dto = plainToInstance(LoginRequestDto, request.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException(
        errors.flatMap((error) => Object.values(error.constraints ?? {})),
      );
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}
