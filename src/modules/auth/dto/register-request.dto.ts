import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * 로컬 회원가입 요청 DTO
 */
export class RegisterRequestDto {
  @ApiProperty({ description: '이메일', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: '비밀번호 (8자 이상)',
    example: 'password123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: '닉네임', example: '몽몽이', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nickname!: string;

  @ApiPropertyOptional({
    description: '친구 초대 코드',
    example: 'AB12CD34',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  friendInviteCode?: string;
}
