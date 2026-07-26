import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * 로컬 회원가입 요청 DTO
 */
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nickname!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  friendInviteCode?: string;
}
