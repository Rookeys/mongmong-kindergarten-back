import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * 로컬 로그인 요청 DTO
 */
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
