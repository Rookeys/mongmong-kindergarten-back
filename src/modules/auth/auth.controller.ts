import { ApiErrors } from '../../common/api-errors.decorator';
import { ErrorCode } from '../../common/error-code';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetUserResponseDto } from '../user/dto/get/get-user-response.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { KakaoLoginRequestDto } from './dto/kakao-login-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { UpdateMeRequestDto } from './dto/update-me-request.dto';
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
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalGuard)
  @ApiOperation({ summary: '로컬 로그인' })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ description: '로그인 성공', type: AuthTokenResponseDto })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_EMAIL_NOT_FOUND,
    ErrorCode.AUTH_WRONG_PASSWORD,
    ErrorCode.AUTH_SOCIAL_ACCOUNT,
    ErrorCode.AUTH_PASSWORD_NOT_SET,
    ErrorCode.AUTH_ACCOUNT_INACTIVE,
  )
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
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.EMAIL_ALREADY_EXISTS,
    ErrorCode.INVITE_CODE_INVALID,
  )
  async register(
    @Body() dto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  /**
   * 카카오 로그인
   */
  @Post('kakao')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '카카오 로그인',
    description: '프론트에서 받은 kakaoAccessToken으로 로그인/가입합니다.',
  })
  @ApiBody({ type: KakaoLoginRequestDto })
  @ApiOkResponse({ description: '로그인 성공', type: AuthTokenResponseDto })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.KAKAO_TOKEN_INVALID,
    ErrorCode.KAKAO_PROFILE_UNAVAILABLE,
    ErrorCode.KAKAO_UPSTREAM_ERROR,
  )
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
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.USER_NOT_FOUND,
  )
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
  @ApiBody({ type: UpdateMeRequestDto })
  @ApiOkResponse({ description: '수정 성공', type: GetUserResponseDto })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.USER_NOT_FOUND,
    ErrorCode.QUESTION_SERIES_NOT_FOUND,
  )
  async updateMe(
    @Req() request: JwtAuthRequest,
    @Body() dto: UpdateMeRequestDto,
  ): Promise<GetUserResponseDto> {
    return this.userService.update(request.user.sub, dto);
  }
}
