import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../user/enums/user-role.enum';

/**
 * JWT payload (request.user)
 */
export class JwtPayloadDto {
  @ApiProperty({ description: '사용자 ID', example: '1' })
  sub!: string;

  @ApiProperty({ description: '이메일', example: 'user@example.com' })
  email!: string;

  @ApiProperty({
    description: '권한',
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.USER,
  })
  role!: UserRole;
}
