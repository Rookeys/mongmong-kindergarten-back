import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetUserResponseDto } from '../user/dto/get/get-user-response.dto';
import { UpdateUserRequestDto } from '../user/dto/patch/update-user-request.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { KakaoLoginRequestDto } from './dto/kakao-login-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { JwtGuard } from './guard/jwt.guard';
import { LocalGuard } from './guard/local.guard';

type LocalAuthRequest = {
  user: GetUserResponseDto;
};

type JwtAuthRequest = {
  user: JwtPayloadDto;
};

/**
 * 인증 및 내 프로필 API 컨트롤러
 */
@ApiTags('auth')
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
  @ApiOperation({ summary: '로컬 로그인' })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ description: '로그인 성공', type: AuthTokenResponseDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async login(
    @Body() _loginDto: LoginRequestDto,
    @Req() request: LocalAuthRequest,
  ): Promise<AuthTokenResponseDto> {
    return this.authService.login(request.user);
  }

  /**
   * 로컬 회원가입
   */
  @Post('register')
  @ApiOperation({ summary: '로컬 회원가입' })
  @ApiBody({ type: RegisterRequestDto })
  @ApiCreatedResponse({
    description: '회원가입 성공',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({ description: '유효성 검사 실패 또는 이메일 중복' })
  async register(
    @Body() dto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  /**
   * 카카오 로그인
   */
  @Post('kakao')
  @ApiOperation({
    summary: '카카오 로그인',
    description: '프론트에서 받은 kakaoAccessToken으로 로그인/가입합니다.',
  })
  @ApiBody({ type: KakaoLoginRequestDto })
  @ApiOkResponse({ description: '로그인 성공', type: AuthTokenResponseDto })
  @ApiUnauthorizedResponse({ description: '카카오 토큰이 유효하지 않음' })
  async kakaoLogin(
    @Body() dto: KakaoLoginRequestDto,
  ): Promise<AuthTokenResponseDto> {
    return this.authService.loginWithKakao(dto.kakaoAccessToken);
  }

  /**
   * 내 프로필 조회
   */
  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiOkResponse({ description: '조회 성공', type: GetUserResponseDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async getMe(@Req() request: JwtAuthRequest): Promise<GetUserResponseDto> {
    return this.userService.findOne(request.user.sub);
  }

  /**
   * 내 프로필 수정
   */
  @Patch('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 수정' })
  @ApiBody({ type: UpdateUserRequestDto })
  @ApiOkResponse({ description: '수정 성공', type: GetUserResponseDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async updateMe(
    @Req() request: JwtAuthRequest,
    @Body() dto: UpdateUserRequestDto,
  ): Promise<GetUserResponseDto> {
    return this.userService.update(request.user.sub, dto);
  }
}
