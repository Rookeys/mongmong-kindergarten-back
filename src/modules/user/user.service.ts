import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import { assignDefined } from '../../common/utils/assign-defined.util';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { LocaleType } from '../../common/enums/locale-type.enum';
import { BCRYPT_SALT_ROUNDS } from '../auth/constants/password.constants';
import { QuestionSeries } from '../question/entities/question-series.entity';
import {
  CreateUserRequestDto,
  DeleteUserResponseDto,
  GetUserResponseDto,
  GetUserSettingResponseDto,
  GetUsersRequestDto,
  UpdateUserRequestDto,
  UpdateUserSettingRequestDto,
} from './dto';
import { User } from './entities/user.entity';
import { UserInvite } from './entities/user-invite.entity';
import { UserSetting } from './entities/user-setting.entity';
import { LoginType } from './enums/login-type.enum';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';
import { createInviteCode } from './utils/create-invite-code.util';

/**
 * 사용자 CRUD 서비스
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSetting)
    private readonly userSettingRepository: Repository<UserSetting>,
    @InjectRepository(QuestionSeries)
    private readonly questionSeriesRepository: Repository<QuestionSeries>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 사용자 목록을 조회한다.
   */
  async findAll(query: GetUsersRequestDto): Promise<GetUserResponseDto[]> {
    const users = await this.userRepository.find({
      where: query.status ? { status: query.status } : {},
      order: { id: 'ASC' },
    });
    return users.map((user: User) => this.mapUserToResponse(user));
  }

  /**
   * id로 사용자를 조회한다.
   */
  async findById(userId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw AppException.withTarget(ErrorCode.USER_NOT_FOUND, {
        userId: userId,
      });
    }
    return user;
  }

  /**
   * id로 사용자 응답 DTO를 반환한다.
   */
  async findOne(userId: string): Promise<GetUserResponseDto> {
    const user = await this.findById(userId);
    return this.mapUserToResponse(user);
  }

  /**
   * 로컬 사용자를 생성한다.
   */
  async create(dto: CreateUserRequestDto): Promise<GetUserResponseDto> {
    await this.ensureEmailIsAvailable(dto.email);
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const savedUser = await this.dataSource.transaction(async (manager) => {
      const inviter = await this.findInviterByCode(
        manager,
        dto.friendInviteCode,
      );
      const user = await manager.save(
        User,
        this.buildLocalUserPayload(dto, hashedPassword),
      );
      await manager.save(UserSetting, this.buildDefaultUserSetting(user));
      if (inviter) {
        await manager.save(UserInvite, {
          inviterUserId: inviter.id,
          inviteeUserId: user.id,
          inviteCode: inviter.myInviteCode,
          rewardGivenYn: false,
        });
      }
      return user;
    });
    return this.mapUserToResponse(savedUser);
  }

  /**
   * 소셜 로그인 사용자를 생성한다.
   */
  async createSocialUser(input: {
    email: string | null;
    loginType: LoginType;
    providerId: string;
  }): Promise<User> {
    if (input.email) {
      await this.ensureEmailIsAvailable(input.email);
    }
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.save(User, {
        email: input.email,
        password: null,
        nickname: null,
        loginType: input.loginType,
        providerId: input.providerId,
        rewardCount: 0,
        aiReplyCycle: 0,
        myInviteCode: createInviteCode(),
        status: UserStatus.ACTIVE,
        role: UserRole.USER,
        deletedRequestAt: null,
        lastLoginDate: null,
        questionSeriesId: null,
      });
      await manager.save(UserSetting, this.buildDefaultUserSetting(user));
      return user;
    });
  }

  /**
   * 사용자 정보를 부분 수정한다.
   */
  async update(
    userId: string,
    dto: UpdateUserRequestDto,
  ): Promise<GetUserResponseDto> {
    const user = await this.findById(userId);
    await this.applyUserUpdates(user, dto);
    const savedUser = await this.userRepository.save(user);
    return this.mapUserToResponse(savedUser);
  }

  /**
   * 사용자를 소프트 삭제한다. 같은 이메일·카카오 계정으로 다시 가입할 수 있도록 로그인 식별값을 비운다.
   */
  async remove(userId: string): Promise<DeleteUserResponseDto> {
    const user = await this.findById(userId);
    user.status = UserStatus.DELETED;
    user.deletedRequestAt = new Date();
    user.email = null;
    user.providerId = null;
    await this.userRepository.save(user);
    return {
      message: '사용자 삭제를 완료했습니다.',
      id: userId,
      statusCode: 200,
    };
  }

  /**
   * 내 설정을 조회한다.
   */
  async findSetting(userId: string): Promise<GetUserSettingResponseDto> {
    const setting = await this.findSettingEntity(userId);
    return this.mapSettingToResponse(setting);
  }

  /**
   * 내 설정을 부분 수정한다.
   */
  async updateSetting(
    userId: string,
    dto: UpdateUserSettingRequestDto,
  ): Promise<GetUserSettingResponseDto> {
    const setting = await this.findSettingEntity(userId);
    assignDefined(setting, dto);
    const savedSetting = await this.userSettingRepository.save(setting);
    return this.mapSettingToResponse(savedSetting);
  }

  /**
   * User 엔티티를 응답 DTO로 변환한다.
   */
  mapUserToResponse(user: User): GetUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      loginType: user.loginType,
      providerId: user.providerId,
      rewardCount: user.rewardCount,
      aiReplyCycle: user.aiReplyCycle,
      myInviteCode: user.myInviteCode,
      status: user.status,
      role: user.role,
      lastLoginDate: user.lastLoginDate,
      questionSeriesId: user.questionSeriesId,
      deletedRequestAt: user.deletedRequestAt,
      createdDate: user.createdDate,
      updatedDate: user.updatedDate,
    };
  }

  /** 설정은 가입할 때 같이 만든다 */
  private async findSettingEntity(userId: string): Promise<UserSetting> {
    const setting = await this.userSettingRepository.findOneBy({ userId });
    if (!setting) {
      throw AppException.withTarget(ErrorCode.USER_NOT_FOUND, {
        userId: userId,
      });
    }
    return setting;
  }

  private mapSettingToResponse(
    setting: UserSetting,
  ): GetUserSettingResponseDto {
    return {
      localeType: setting.localeType,
      setLetterIsPrivate: setting.setLetterIsPrivate,
      setLetterIsPrivateSns: setting.setLetterIsPrivateSns,
      pushEnabled: setting.pushEnabled,
    };
  }

  private async ensureEmailIsAvailable(email: string): Promise<void> {
    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }
  }

  private async findInviterByCode(
    manager: EntityManager,
    friendInviteCode?: string,
  ): Promise<User | null> {
    if (!friendInviteCode) {
      return null;
    }
    const inviter = await manager.findOneBy(User, {
      myInviteCode: friendInviteCode,
    });
    if (!inviter) {
      throw new AppException(
        ErrorCode.INVITE_CODE_INVALID,
        { friendInviteCode },
        undefined,
        `유효하지 않은 친구 초대 코드입니다. (${friendInviteCode})`,
      );
    }
    return inviter;
  }

  private buildLocalUserPayload(
    dto: CreateUserRequestDto,
    hashedPassword: string,
  ): Partial<User> {
    return {
      email: dto.email,
      password: hashedPassword,
      nickname: dto.nickname,
      loginType: LoginType.LOCAL,
      providerId: null,
      rewardCount: 0,
      aiReplyCycle: 0,
      myInviteCode: createInviteCode(),
      status: UserStatus.ACTIVE,
      role: UserRole.USER,
      deletedRequestAt: null,
      lastLoginDate: null,
      questionSeriesId: null,
    };
  }

  private buildDefaultUserSetting(user: User): Partial<UserSetting> {
    return {
      user,
      localeType: LocaleType.KO,
      // 처음 쓰는 일지가 공개 여부를 묻기 전에 휴게실·SNS에 노출되지 않도록 비공개로 시작
      setLetterIsPrivate: true,
      setLetterIsPrivateSns: true,
      pushEnabled: true,
    };
  }

  private async applyUserUpdates(
    user: User,
    dto: UpdateUserRequestDto,
  ): Promise<void> {
    if (dto.nickname !== undefined) {
      user.nickname = dto.nickname;
    }
    if (dto.status !== undefined) {
      user.status = dto.status;
    }
    if (dto.questionSeriesId !== undefined) {
      const series = await this.questionSeriesRepository.findOneBy({
        id: dto.questionSeriesId,
      });
      if (!series) {
        throw AppException.withTarget(ErrorCode.QUESTION_SERIES_NOT_FOUND, {
          questionSeriesId: dto.questionSeriesId,
        });
      }
      user.questionSeriesId = series.id;
    }
  }
}
