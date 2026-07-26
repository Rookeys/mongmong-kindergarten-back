import { ApiProperty } from '@nestjs/swagger';

/**
 * JWT payload (request.user)
 */
export class JwtPayloadDto {
  @ApiProperty({ description: '사용자 ID', example: '1' })
  sub!: string;

  @ApiProperty({ description: '이메일', example: 'user@example.com' })
  email!: string;
}
