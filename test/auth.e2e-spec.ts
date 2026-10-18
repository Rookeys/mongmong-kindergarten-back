import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ErrorCode } from '../src/common/error-code';
import { LocaleType } from '../src/common/enums/locale-type.enum';
import { AuthService } from '../src/modules/auth/auth.service';
import { KakaoAuthService } from '../src/modules/auth/services/kakao-auth.service';
import { UserInvite } from '../src/modules/user/entities/user-invite.entity';
import { UserStatus } from '../src/modules/user/enums/user-status.enum';
import { UserService } from '../src/modules/user/user.service';
import { createTestModule, createUser } from './support/create-test-module';

describe('인증 토큰과 내 계정', () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let userService: UserService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    authService = moduleRef.get(AuthService);
    userService = moduleRef.get(UserService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function loginNewUser(): Promise<{
    userId: string;
    refreshToken: string;
  }> {
    const user = await createUser(moduleRef);
    const response = await authService.login(
      userService.mapUserToResponse(user),
    );
    return { userId: user.id, refreshToken: response.refreshToken };
  }

  it('Refresh Token으로 갱신하면 새 토큰을 주고 이전 토큰은 못 쓴다', async () => {
    const { refreshToken } = await loginNewUser();

    const refreshed = await authService.refresh(refreshToken);

    expect(refreshed.refreshToken).not.toBe(refreshToken);
    await expect(authService.refresh(refreshToken)).rejects.toMatchObject({
      code: ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
    });
    await expect(
      authService.refresh(refreshed.refreshToken),
    ).resolves.toBeDefined();
  });

  it('같은 Refresh Token으로 동시에 갱신하면 하나만 성공한다', async () => {
    const { refreshToken } = await loginNewUser();

    const results = await Promise.allSettled([
      authService.refresh(refreshToken),
      authService.refresh(refreshToken),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
  });

  it('로그아웃하면 그 Refresh Token은 못 쓴다', async () => {
    const { refreshToken } = await loginNewUser();

    await authService.logout(refreshToken);

    await expect(authService.refresh(refreshToken)).rejects.toMatchObject({
      code: ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
    });
  });

  it('탈퇴하면 모든 기기의 Refresh Token이 폐기된다', async () => {
    const { userId, refreshToken } = await loginNewUser();

    await authService.withdraw(userId);

    await expect(authService.refresh(refreshToken)).rejects.toMatchObject({
      code: ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
    });
  });

  it('설정은 보낸 필드만 바뀐다', async () => {
    const user = await createUser(moduleRef);

    const updated = await userService.updateSetting(user.id, {
      pushEnabled: false,
    });

    expect(updated).toEqual({
      localeType: LocaleType.KO,
      setLetterIsPrivate: true,
      setLetterIsPrivateSns: true,
      pushEnabled: false,
    });
  });

  it('탈퇴하면 같은 이메일로 다시 가입할 수 있다', async () => {
    const user = await createUser(moduleRef);
    const email = user.email as string;

    await authService.withdraw(user.id);
    const rejoined = await userService.create({
      email,
      password: 'password123',
      nickname: '재가입',
    });

    expect(rejoined.id).not.toBe(user.id);
    expect(rejoined.email).toBe(email);
  });

  it('카카오로 탈퇴한 뒤 다시 로그인하면 새 계정으로 가입된다', async () => {
    const kakaoAuthService = moduleRef.get(KakaoAuthService);
    jest
      .spyOn(kakaoAuthService, 'fetchUserProfile')
      .mockResolvedValue({ id: 770001 });
    const first = await authService.loginWithKakao('token');

    await authService.withdraw(first.user.id);
    const second = await authService.loginWithKakao('token');

    expect(second.user.id).not.toBe(first.user.id);
    expect(second.user.status).toBe(UserStatus.ACTIVE);
  });

  it('카카오 이메일이 이미 다른 계정에 있으면 이메일 없이 가입된다', async () => {
    const localUser = await createUser(moduleRef);
    const kakaoAuthService = moduleRef.get(KakaoAuthService);
    jest
      .spyOn(kakaoAuthService, 'fetchUserProfile')
      .mockResolvedValue({ id: 770002 });
    jest
      .spyOn(kakaoAuthService, 'extractEmail')
      .mockReturnValue(localUser.email);

    const response = await authService.loginWithKakao('token');

    expect(response.user.id).not.toBe(localUser.id);
    expect(response.user.email).toBeNull();
  });

  it('온보딩에서 초대 코드를 등록하면 첫 일지 때 보상 대기 상태가 되고, 두 번은 못 한다', async () => {
    const inviter = await createUser(moduleRef);
    const invitee = await createUser(moduleRef);

    await userService.registerInviteCode(invitee.id, inviter.myInviteCode);

    await expect(
      userService.registerInviteCode(invitee.id, inviter.myInviteCode),
    ).rejects.toMatchObject({ code: ErrorCode.INVITE_ALREADY_REGISTERED });
    await expect(
      userService.registerInviteCode(inviter.id, inviter.myInviteCode),
    ).rejects.toMatchObject({ code: ErrorCode.INVITE_CODE_INVALID });
    expect(
      await moduleRef.get(DataSource).getRepository(UserInvite).findOneBy({
        inviteeUserId: invitee.id,
      }),
    ).toMatchObject({ inviterUserId: inviter.id, rewardGivenYn: false });
  });
});
