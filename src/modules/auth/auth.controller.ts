import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { UpdateUserProfileDto } from '../user/dto/update-user-profile.dto';
import { AuthService } from './auth.service';
import { KakaoLoginDto } from './dto/kakao-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtGuard } from './guard/jwt.guard';
import { LocalGuard } from './guard/local.guard';
import type { AuthTokenResponse, JwtPayload } from './types/login-user.type';
import type { UserWithoutPassword } from './types/user-without-password.type';

type LocalAuthRequest = {
  user: UserWithoutPassword;
};

type JwtAuthRequest = {
  user: JwtPayload;
};

/**
 * 인증 및 내 프로필 API 컨트롤러
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /**
   * 로컬 로그인
   */
  @Post('login')
  @UseGuards(LocalGuard)
  async login(
    @Body() _loginDto: LoginDto,
    @Req() request: LocalAuthRequest,
  ): Promise<AuthTokenResponse> {
    return this.authService.login(request.user);
  }

  /**
   * 로컬 회원가입
   */
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<UserWithoutPassword> {
    return this.authService.register({
      email: dto.email,
      password: dto.password,
      nickname: dto.nickname,
      friendInviteCode: dto.friendInviteCode,
    });
  }

  /**
   * 카카오 로그인 (프론트에서 받은 kakaoAccessToken 사용)
   */
  @Post('kakao')
  async kakaoLogin(@Body() dto: KakaoLoginDto): Promise<AuthTokenResponse> {
    return this.authService.loginWithKakao(dto.kakaoAccessToken);
  }

  /**
   * 내 프로필 조회
   */
  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@Req() request: JwtAuthRequest): Promise<UserWithoutPassword> {
    return this.userService.findPublicById(request.user.sub);
  }

  /**
   * 내 프로필 수정
   */
  @Patch('me')
  @UseGuards(JwtGuard)
  async updateMe(
    @Req() request: JwtAuthRequest,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserWithoutPassword> {
    return this.userService.updateProfile(request.user.sub, dto);
  }
}
