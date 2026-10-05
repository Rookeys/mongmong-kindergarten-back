import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 카카오 로그인 요청 DTO
 */
export class KakaoLoginRequestDto {
  @ApiProperty({
    description: '카카오 Access Token',
    example: 'kakao_access_token_example',
  })
  @IsString()
  @IsNotEmpty()
  kakaoAccessToken!: string;
}
