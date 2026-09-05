import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { GetUserResponseDto } from '../user/dto/get/get-user-response.dto';
import { CreateUserRequestDto } from '../user/dto/post/create-user-request.dto';
import { User } from '../user/entities/user.entity';
import { LoginType } from '../user/enums/login-type.enum';
import { UserStatus } from '../user/enums/user-status.enum';
import { UserService } from '../user/user.service';
import { JWT_ACCESS_EXPIRES_IN_SECONDS } from './constants/token.constants';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { KakaoAuthService } from './services/kakao-auth.service';
import type { KakaoUserProfile } from './types/kakao-user-profile.type';

type LoginUser = Pick<GetUserResponseDto, 'id' | 'email' | 'role'>;

/**
 * 로컬/카카오 인증 및 토큰 발급 서비스
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
  ): Promise<GetUserResponseDto | null> {
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
    return this.userService.mapUserToResponse(user);
  }

  /**
   * 검증된 사용자에게 Access Token을 발급한다.
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
    return this.userService.createSocialUser({
      email,
      nickname,
      loginType: LoginType.KAKAO,
      providerId,
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
    user: GetUserResponseDto,
  ): AuthTokenResponseDto {
    const loginUser: LoginUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: this.createAccessToken(loginUser),
      user,
    };
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
      throw new UnauthorizedException('JWT_SECRET is not defined.');
    }
    return jwtSecret;
  }
}
