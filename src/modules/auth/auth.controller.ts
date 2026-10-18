import { ApiErrors } from '../../common/api-errors.decorator';
import { ErrorCode } from '../../common/error-code';
import { Throttle } from '@nestjs/throttler';
import { AUTH_THROTTLE } from '../../common/constants/throttle.constants';
import {
  Body,
  Controller,
  Delete,
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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DeleteUserResponseDto } from '../user/dto/delete/delete-user-response.dto';
import { GetUserResponseDto } from '../user/dto/get/get-user-response.dto';
import { GetUserSettingResponseDto } from '../user/dto/get/get-user-setting-response.dto';
import { UpdateUserSettingRequestDto } from '../user/dto/patch/update-user-setting-request.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { KakaoLoginRequestDto } from './dto/kakao-login-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto';
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
  @Throttle(AUTH_THROTTLE)
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
  @Throttle(AUTH_THROTTLE)
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
  @Throttle(AUTH_THROTTLE)
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
    ErrorCode.AUTH_ACCOUNT_INACTIVE,
  )
  async kakaoLogin(
    @Body() dto: KakaoLoginRequestDto,
  ): Promise<AuthTokenResponseDto> {
    return this.authService.loginWithKakao(dto.kakaoAccessToken);
  }

  /**
   * 토큰 갱신
   */
  @Post('refresh')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '토큰 갱신',
    description:
      'Access Token이 만료되면(AUTH_TOKEN_EXPIRED) Refresh Token으로 새 토큰 쌍을 받는다. 쓴 Refresh Token은 폐기되므로 응답의 새 값으로 바꿔 저장한다. 같은 토큰으로 동시에 요청하면 하나만 성공하므로 갱신 요청은 한 번만 보낸다.',
  })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiOkResponse({ description: '갱신 성공', type: AuthTokenResponseDto })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
    ErrorCode.AUTH_ACCOUNT_INACTIVE,
    ErrorCode.USER_NOT_FOUND,
  )
  async refresh(
    @Body() dto: RefreshTokenRequestDto,
  ): Promise<AuthTokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * 로그아웃
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '로그아웃',
    description:
      '이 기기의 Refresh Token을 폐기한다. 이미 폐기된 토큰이어도 성공한다. Access Token은 만료(최대 1시간)까지 유효하므로 클라이언트에서 지운다.',
  })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiNoContentResponse({ description: '로그아웃 성공' })
  @ApiErrors(ErrorCode.VALIDATION_FAILED)
  async logout(@Body() dto: RefreshTokenRequestDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
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
  @ApiOperation({
    summary: '내 프로필 수정',
    description:
      '보낸 필드만 바꾼다. 온보딩에서 닉네임과 친구 초대 코드(선택)를 함께 보낼 수 있다. 초대 코드가 잘못되면 아무것도 바꾸지 않는다.',
  })
  @ApiBody({ type: UpdateMeRequestDto })
  @ApiOkResponse({ description: '수정 성공', type: GetUserResponseDto })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.USER_NOT_FOUND,
    ErrorCode.QUESTION_SERIES_NOT_FOUND,
    ErrorCode.INVITE_CODE_INVALID,
    ErrorCode.INVITE_ALREADY_REGISTERED,
    ErrorCode.INVITE_CODE_TOO_LATE,
  )
  async updateMe(
    @Req() request: JwtAuthRequest,
    @Body() dto: UpdateMeRequestDto,
  ): Promise<GetUserResponseDto> {
    const { friendInviteCode, ...profile } = dto;
    if (friendInviteCode) {
      await this.userService.registerInviteCode(
        request.user.sub,
        friendInviteCode,
      );
    }
    return this.userService.update(request.user.sub, profile);
  }

  /**
   * 본인 탈퇴
   */
  @Delete('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '본인 탈퇴',
    description:
      '계정을 소프트 삭제(status=deleted)하고 모든 기기의 Refresh Token을 폐기한다. 이메일·카카오 연결을 비우므로 같은 이메일·카카오 계정으로 새로 가입할 수 있다(이전 기록은 이어지지 않음). 탈퇴한 사용자의 일지는 휴게실에서 내려간다.',
  })
  @ApiOkResponse({ description: '탈퇴 성공', type: DeleteUserResponseDto })
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.USER_NOT_FOUND,
  )
  async withdraw(
    @Req() request: JwtAuthRequest,
  ): Promise<DeleteUserResponseDto> {
    return this.authService.withdraw(request.user.sub);
  }

  /**
   * 내 설정 조회
   */
  @Get('me/settings')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 설정 조회' })
  @ApiOkResponse({ description: '조회 성공', type: GetUserSettingResponseDto })
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.USER_NOT_FOUND,
  )
  async getMySetting(
    @Req() request: JwtAuthRequest,
  ): Promise<GetUserSettingResponseDto> {
    return this.userService.findSetting(request.user.sub);
  }

  /**
   * 내 설정 수정
   */
  @Patch('me/settings')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '내 설정 수정',
    description: '보낸 필드만 갱신한다.',
  })
  @ApiBody({ type: UpdateUserSettingRequestDto })
  @ApiOkResponse({ description: '수정 성공', type: GetUserSettingResponseDto })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.USER_NOT_FOUND,
  )
  async updateMySetting(
    @Req() request: JwtAuthRequest,
    @Body() dto: UpdateUserSettingRequestDto,
  ): Promise<GetUserSettingResponseDto> {
    return this.userService.updateSetting(request.user.sub, dto);
  }
}
