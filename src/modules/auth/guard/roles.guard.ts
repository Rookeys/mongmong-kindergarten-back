import { ExecutionContext, Injectable } from '@nestjs/common';
import { AppException } from '../../../common/app-exception';
import { ErrorCode } from '../../../common/error-code';
import { CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayloadDto } from '../dto/jwt-payload.dto';
import { UserRole } from '../../user/enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * JwtGuard 뒤에 붙여 request.user.role이 @Roles로 지정된 권한인지 검사한다.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{
      user: JwtPayloadDto;
    }>();
    if (!requiredRoles.includes(request.user.role)) {
      throw new AppException(ErrorCode.FORBIDDEN_ROLE);
    }
    return true;
  }
}
