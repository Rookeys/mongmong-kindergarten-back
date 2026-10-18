import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 토큰 갱신·로그아웃 요청 DTO
 */
export class RefreshTokenRequestDto {
  @ApiProperty({
    description: '로그인 응답으로 받은 Refresh Token',
    example: 'kM2x9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
