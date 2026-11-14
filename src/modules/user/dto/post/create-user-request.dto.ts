import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NICKNAME_PATTERN } from '../../constants/nickname.constants';

/**
 * 사용자 생성 요청 DTO
 */
export class CreateUserRequestDto {
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

  @ApiProperty({
    description: '닉네임 (2~8자, 한글·일본어·영문 소문자·숫자)',
    example: '몽몽이',
    minLength: 2,
    maxLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(NICKNAME_PATTERN)
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
