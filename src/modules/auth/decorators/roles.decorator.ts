import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user/enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * 엔드포인트 접근을 특정 UserRole로 제한한다. RolesGuard와 함께 사용한다.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
