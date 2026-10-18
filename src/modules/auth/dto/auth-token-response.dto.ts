import { ApiProperty } from '@nestjs/swagger';
import { GetUserResponseDto } from '../../user/dto/get/get-user-response.dto';

/**
 * 인증 토큰 응답 DTO
 */
export class AuthTokenResponseDto {
  @ApiProperty({
    description: 'JWT Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description:
      'Refresh Token. Access Token이 만료되면 POST /auth/refresh로 새 토큰 쌍을 받는다. 갱신하면 이전 값은 못 쓴다',
    example: 'kM2x9...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: '로그인한 사용자 정보',
    type: GetUserResponseDto,
  })
  user!: GetUserResponseDto;
}
