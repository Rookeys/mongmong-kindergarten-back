import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 카카오 로그인 요청 DTO
 */
export class KakaoLoginDto {
  @IsString()
  @IsNotEmpty()
  kakaoAccessToken!: string;
}
