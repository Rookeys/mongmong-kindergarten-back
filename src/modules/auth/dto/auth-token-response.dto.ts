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
    description: '로그인한 사용자 정보',
    type: GetUserResponseDto,
  })
  user!: GetUserResponseDto;
}
