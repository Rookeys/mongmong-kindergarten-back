import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UserWithoutPassword } from '../auth/types/user-without-password.type';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { User } from './entities/user.entity';

/**
 * 사용자 프로필 조회/수정 서비스
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * id로 사용자를 조회한다.
   */
  async findById(userId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  /**
   * id로 공개 사용자 정보를 반환한다.
   */
  async findPublicById(userId: string): Promise<UserWithoutPassword> {
    const user = await this.findById(userId);
    return this.mapUserToPublic(user);
  }

  /**
   * 프로필(닉네임)을 수정한다.
   */
  async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserWithoutPassword> {
    const user = await this.findById(userId);
    if (dto.nickname !== undefined) {
      user.nickname = dto.nickname;
    }
    const savedUser = await this.userRepository.save(user);
    return this.mapUserToPublic(savedUser);
  }

  /**
   * User를 비밀번호 없는 공개 형태로 변환한다.
   */
  mapUserToPublic(user: User): UserWithoutPassword {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      loginType: user.loginType,
      providerId: user.providerId,
      rewardCount: user.rewardCount,
      aiReplyCycle: user.aiReplyCycle,
      myInviteCode: user.myInviteCode,
      friendInviteCode: user.friendInviteCode,
      status: user.status,
      lastLoginDate: user.lastLoginDate,
      createdDate: user.createdDate,
      updatedDate: user.updatedDate,
    };
  }
}
