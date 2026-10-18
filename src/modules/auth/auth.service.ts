import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { LessThan, Repository } from 'typeorm';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import { GetUserResponseDto } from '../user/dto/get/get-user-response.dto';
import { CreateUserRequestDto } from '../user/dto/post/create-user-request.dto';
import { User } from '../user/entities/user.entity';
import { LoginType } from '../user/enums/login-type.enum';
import { UserStatus } from '../user/enums/user-status.enum';
import { DeleteUserResponseDto } from '../user/dto/delete/delete-user-response.dto';
import { UserService } from '../user/user.service';
import {
  JWT_ACCESS_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_EXPIRES_IN_DAYS,
} from './constants/token.constants';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { KakaoAuthService } from './services/kakao-auth.service';
import type { KakaoUserProfile } from './types/kakao-user-profile.type';

const LOGIN_TYPE_LABEL: Record<LoginType, string> = {
  [LoginType.LOCAL]: '이메일',
  [LoginType.KAKAO]: '카카오',
};

type LoginUser = Pick<GetUserResponseDto, 'id' | 'email' | 'role'>;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 로컬/카카오 인증 및 토큰 발급 서비스
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly kakaoAuthService: KakaoAuthService,
    private readonly userService: UserService,
  ) {}

  /**
   * 로컬 로그인 자격 증명을 검증한다.
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<GetUserResponseDto> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new AppException(ErrorCode.AUTH_EMAIL_NOT_FOUND);
    }
    if (user.loginType !== LoginType.LOCAL) {
      throw new AppException(
        ErrorCode.AUTH_SOCIAL_ACCOUNT,
        { loginType: user.loginType },
        undefined,
        `${LOGIN_TYPE_LABEL[user.loginType]}로 가입된 계정입니다. ${LOGIN_TYPE_LABEL[user.loginType]} 로그인을 이용해주세요.`,
      );
    }
    if (!user.password) {
      throw new AppException(ErrorCode.AUTH_PASSWORD_NOT_SET);
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new AppException(
        ErrorCode.AUTH_ACCOUNT_INACTIVE,
        { status: user.status },
        undefined,
        user.status === UserStatus.DELETED
          ? '탈퇴한 계정입니다.'
          : '비활성화된 계정입니다. 고객센터에 문의해주세요.',
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppException(ErrorCode.AUTH_WRONG_PASSWORD);
    }
    return this.userService.mapUserToResponse(user);
  }

  /**
   * 검증된 사용자에게 Access/Refresh Token을 발급한다.
   */
  async login(user: GetUserResponseDto): Promise<AuthTokenResponseDto> {
    await this.touchLastLoginDate(user.id);
    const latestUser = await this.userService.findOne(user.id);
    return this.createAuthTokenResponse(latestUser);
  }

  /**
   * 로컬 회원가입을 처리한다.
   */
  async register(dto: CreateUserRequestDto): Promise<GetUserResponseDto> {
    return this.userService.create(dto);
  }

  /**
   * Refresh Token으로 새 토큰 쌍을 발급한다. 쓴 Refresh Token은 폐기한다.
   */
  async refresh(refreshToken: string): Promise<AuthTokenResponseDto> {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findOneBy({
      tokenHash,
    });
    if (!storedToken) {
      throw new AppException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID);
    }
    // 한 토큰은 한 번만 쓴다. 같은 토큰으로 동시에 갱신하면 먼저 지운 요청만 성공한다
    const { affected } = await this.refreshTokenRepository.delete({
      id: storedToken.id,
    });
    if (!affected || storedToken.expiresAt <= new Date()) {
      throw new AppException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID);
    }
    const user = await this.userService.findById(storedToken.userId);
    this.ensureActive(user);
    return this.createAuthTokenResponse(
      this.userService.mapUserToResponse(user),
    );
  }

  /**
   * Refresh Token을 폐기한다. 이미 없는 토큰이어도 성공으로 본다.
   */
  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.delete({
      tokenHash: this.hashToken(refreshToken),
    });
  }

  /**
   * 본인 탈퇴: 계정을 소프트 삭제하고 모든 기기의 Refresh Token을 폐기한다.
   */
  async withdraw(userId: string): Promise<DeleteUserResponseDto> {
    const result = await this.userService.remove(userId);
    await this.refreshTokenRepository.delete({ userId });
    return result;
  }

  /**
   * 카카오 Access Token으로 로그인(또는 가입)한다.
   */
  async loginWithKakao(
    kakaoAccessToken: string,
  ): Promise<AuthTokenResponseDto> {
    const kakaoUserProfile =
      await this.kakaoAuthService.fetchUserProfile(kakaoAccessToken);
    const user = await this.findOrCreateKakaoUser(kakaoUserProfile);
    await this.touchLastLoginDate(user.id);
    return this.createAuthTokenResponse(
      this.userService.mapUserToResponse(user),
    );
  }

  private async findOrCreateKakaoUser(
    kakaoUserProfile: KakaoUserProfile,
  ): Promise<User> {
    const providerId = String(kakaoUserProfile.id);
    const existingUser = await this.findKakaoUser(providerId);
    if (existingUser) {
      this.ensureActive(existingUser);
      return this.updateKakaoUserProfile(existingUser, kakaoUserProfile);
    }
    try {
      return await this.createKakaoUser(kakaoUserProfile, providerId);
    } catch (err) {
      // 같은 계정의 첫 로그인이 동시에 들어오면 먼저 가입된 사용자로 로그인한다
      const concurrentUser = await this.findKakaoUser(providerId);
      if (concurrentUser) {
        return concurrentUser;
      }
      throw err;
    }
  }

  private async findKakaoUser(providerId: string): Promise<User | null> {
    return this.userRepository.findOneBy({
      loginType: LoginType.KAKAO,
      providerId,
    });
  }

  private async createKakaoUser(
    kakaoUserProfile: KakaoUserProfile,
    providerId: string,
  ): Promise<User> {
    const email = this.kakaoAuthService.extractEmail(kakaoUserProfile);
    // 카카오가 주 로그인이다. 이메일이 이미 다른 계정에 있으면 가입을 막지 않고 이메일 없이 가입시킨다
    const isEmailTaken =
      email !== null && (await this.userRepository.existsBy({ email }));
    return this.userService.createSocialUser({
      email: isEmailTaken ? null : email,
      loginType: LoginType.KAKAO,
      providerId,
    });
  }

  /** 관리자가 비활성화한 계정은 로그인할 수 없다. 탈퇴 계정은 식별값이 비워져 여기까지 오지 않는다 */
  private ensureActive(user: User): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new AppException(ErrorCode.AUTH_ACCOUNT_INACTIVE, {
        status: user.status,
      });
    }
  }

  private async updateKakaoUserProfile(
    user: User,
    kakaoUserProfile: KakaoUserProfile,
  ): Promise<User> {
    const email = this.kakaoAuthService.extractEmail(kakaoUserProfile);
    if (email && email !== user.email) {
      const emailOwner = await this.userRepository.findOneBy({ email });
      if (!emailOwner || emailOwner.id === user.id) {
        user.email = email;
      }
    }
    return this.userRepository.save(user);
  }

  private async touchLastLoginDate(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastLoginDate: new Date() });
  }

  private async createAuthTokenResponse(
    user: GetUserResponseDto,
  ): Promise<AuthTokenResponseDto> {
    const loginUser: LoginUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: this.createAccessToken(loginUser),
      refreshToken: await this.issueRefreshToken(user.id),
      user,
    };
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    // 만료된 토큰은 새로 발급할 때 같이 치운다
    await this.refreshTokenRepository.delete({
      userId,
      expiresAt: LessThan(new Date()),
    });
    await this.refreshTokenRepository.save({
      userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_EXPIRES_IN_DAYS * MS_PER_DAY,
      ),
    });
    return refreshToken;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private createAccessToken(user: LoginUser): string {
    const payload: JwtPayloadDto = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    return this.jwtService.sign(payload, {
      secret: this.getJwtSecret(),
      expiresIn: JWT_ACCESS_EXPIRES_IN_SECONDS,
    });
  }

  private getJwtSecret(): string {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      // 서버 설정 오류: 클라이언트에는 INTERNAL_ERROR로만 노출된다.
      throw new Error('JWT_SECRET is not defined.');
    }
    return jwtSecret;
  }
}
