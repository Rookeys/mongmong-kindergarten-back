import { TestingModule } from '@nestjs/testing';
import { ErrorCode } from '../src/common/error-code';
import { LocaleType } from '../src/common/enums/locale-type.enum';
import { AuthService } from '../src/modules/auth/auth.service';
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
});
