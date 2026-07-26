import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { LocaleType } from '../../common/enums/locale-type.enum';
import { User } from '../user/entities/user.entity';
import { UserSetting } from '../user/entities/user-setting.entity';
import { LoginType } from '../user/enums/login-type.enum';
import { UserStatus } from '../user/enums/user-status.enum';
import { createInviteCode } from '../user/utils/create-invite-code.util';
import { UserService } from '../user/user.service';
import { BCRYPT_SALT_ROUNDS } from './constants/password.constants';
import { JWT_ACCESS_EXPIRES_IN_SECONDS } from './constants/token.constants';
import { KakaoAuthService } from './services/kakao-auth.service';
import type {
  AuthTokenResponse,
  JwtPayload,
  LoginUser,
} from './types/login-user.type';
import type { KakaoUserProfile } from './types/kakao-user-profile.type';
import type { UserWithoutPassword } from './types/user-without-password.type';

/**
 * 로컬/카카오 인증 및 토큰 발급 서비스
 * ERD User 모델(email/password/loginType) 기준으로 동작한다.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
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
  ): Promise<UserWithoutPassword | null> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user?.password) {
      return null;
    }
    if (user.loginType !== LoginType.LOCAL) {
      return null;
    }
    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    return this.userService.mapUserToPublic(user);
  }

  /**
   * 검증된 사용자에게 Access Token을 발급한다.
   */
  async login(user: UserWithoutPassword): Promise<AuthTokenResponse> {
    await this.touchLastLoginDate(user.id);
    return this.createAuthTokenResponse(user);
  }

  /**
   * 로컬 회원가입을 처리한다.
   */
  async register(input: {
    email: string;
    password: string;
    nickname: string;
    friendInviteCode?: string;
  }): Promise<UserWithoutPassword> {
    await this.ensureEmailIsAvailable(input.email);
    const hashedPassword = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
    const savedUser = await this.dataSource.transaction(async (manager) => {
      const user = await manager.save(
        User,
        this.buildLocalUserPayload(input, hashedPassword),
      );
      await manager.save(UserSetting, this.buildDefaultUserSetting(user));
      return user;
    });
    return this.userService.mapUserToPublic(savedUser);
  }

  /**
   * 카카오 Access Token으로 로그인(또는 가입)한다.
   */
  async loginWithKakao(kakaoAccessToken: string): Promise<AuthTokenResponse> {
    const kakaoUserProfile =
      await this.kakaoAuthService.fetchUserProfile(kakaoAccessToken);
    const user = await this.findOrCreateKakaoUser(kakaoUserProfile);
    await this.touchLastLoginDate(user.id);
    return this.createAuthTokenResponse(this.userService.mapUserToPublic(user));
  }

  private async ensureEmailIsAvailable(email: string): Promise<void> {
    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }
  }

  private buildLocalUserPayload(
    input: {
      email: string;
      nickname: string;
      friendInviteCode?: string;
    },
    hashedPassword: string,
  ): Partial<User> {
    return {
      email: input.email,
      password: hashedPassword,
      nickname: input.nickname,
      loginType: LoginType.LOCAL,
      providerId: null,
      rewardCount: 0,
      aiReplyCycle: 0,
      myInviteCode: createInviteCode(),
      friendInviteCode: input.friendInviteCode ?? null,
      status: UserStatus.ACTIVE,
      deletedRequestAt: null,
      lastLoginDate: null,
      questionSeriesId: null,
      currentQuestionId: null,
    };
  }

  private buildDefaultUserSetting(user: User): Partial<UserSetting> {
    return {
      user,
      localeType: LocaleType.KO,
      setLetterIsPrivate: false,
      setLetterIsPrivateSns: false,
      pushEnabled: true,
    };
  }

  private async findOrCreateKakaoUser(
    kakaoUserProfile: KakaoUserProfile,
  ): Promise<User> {
    const providerId = String(kakaoUserProfile.id);
    const existingUser = await this.userRepository.findOneBy({
      loginType: LoginType.KAKAO,
      providerId,
    });
    if (existingUser) {
      return this.updateKakaoUserProfile(existingUser, kakaoUserProfile);
    }
    return this.createKakaoUser(kakaoUserProfile, providerId);
  }

  private async createKakaoUser(
    kakaoUserProfile: KakaoUserProfile,
    providerId: string,
  ): Promise<User> {
    const email = this.resolveKakaoEmail(kakaoUserProfile, providerId);
    const nickname =
      this.kakaoAuthService.extractNickname(kakaoUserProfile) ??
      `카카오유저${providerId}`;
    await this.ensureEmailIsAvailable(email);
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.save(User, {
        email,
        password: null,
        nickname,
        loginType: LoginType.KAKAO,
        providerId,
        rewardCount: 0,
        aiReplyCycle: 0,
        myInviteCode: createInviteCode(),
        friendInviteCode: null,
        status: UserStatus.ACTIVE,
        deletedRequestAt: null,
        lastLoginDate: null,
        questionSeriesId: null,
        currentQuestionId: null,
      });
      await manager.save(UserSetting, this.buildDefaultUserSetting(user));
      return user;
    });
  }

  private resolveKakaoEmail(
    kakaoUserProfile: KakaoUserProfile,
    providerId: string,
  ): string {
    const email = this.kakaoAuthService.extractEmail(kakaoUserProfile);
    if (email) {
      return email;
    }
    return `kakao_${providerId}@kakao.local`;
  }

  private async updateKakaoUserProfile(
    user: User,
    kakaoUserProfile: KakaoUserProfile,
  ): Promise<User> {
    const nickname = this.kakaoAuthService.extractNickname(kakaoUserProfile);
    const email = this.kakaoAuthService.extractEmail(kakaoUserProfile);
    if (nickname) {
      user.nickname = nickname;
    }
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

  private createAuthTokenResponse(
    user: UserWithoutPassword,
  ): AuthTokenResponse {
    const loginUser: LoginUser = { id: user.id, email: user.email };
    return {
      accessToken: this.createAccessToken(loginUser),
      user,
    };
  }

  private createAccessToken(user: LoginUser): string {
    const payload: JwtPayload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload, {
      secret: this.getJwtSecret(),
      expiresIn: JWT_ACCESS_EXPIRES_IN_SECONDS,
    });
  }

  private getJwtSecret(): string {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new UnauthorizedException('JWT_SECRET is not defined.');
    }
    return jwtSecret;
  }
}
