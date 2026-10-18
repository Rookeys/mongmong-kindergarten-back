import { ErrorCode } from '../../common/error-code';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UserInvite } from './entities/user-invite.entity';
import { UserSetting } from './entities/user-setting.entity';
import { UserService } from './user.service';

function createManagerMock(state: { users: Map<string, User> }) {
  const savedInvites: Partial<UserInvite>[] = [];
  let nextId = 100;

  const manager = {
    findOneBy: (entity: unknown, where: Record<string, unknown>) => {
      if (entity === User) {
        return (
          Array.from(state.users.values()).find((user) =>
            Object.entries(where).every(
              ([key, value]) => (user as never)[key] === value,
            ),
          ) ?? null
        );
      }
      throw new Error(`unexpected findOneBy entity: ${String(entity)}`);
    },
    save: (entity: unknown, payload: Record<string, unknown>) => {
      if (entity === User) {
        const id = `u${nextId++}`;
        const saved = { id, ...payload } as User;
        state.users.set(id, saved);
        return saved;
      }
      if (entity === UserSetting) {
        return payload;
      }
      if (entity === UserInvite) {
        savedInvites.push(payload);
        return payload;
      }
      throw new Error(`unexpected save entity: ${String(entity)}`);
    },
  };

  return { manager, savedInvites };
}

function buildService(managerMock: ReturnType<typeof createManagerMock>) {
  const userRepository = { findOneBy: () => Promise.resolve(null) } as never;
  const questionSeriesRepository = {} as never;
  const dataSource = {
    transaction: (cb: (manager: unknown) => unknown) => cb(managerMock.manager),
  } as unknown as DataSource;
  return new UserService(
    userRepository,
    {} as never,
    questionSeriesRepository,
    dataSource,
  );
}

describe('UserService.create (친구 초대 코드)', () => {
  it('초대 코드 없이 가입하면 UserInvite를 생성하지 않는다', async () => {
    const managerMock = createManagerMock({ users: new Map() });
    const service = buildService(managerMock);

    await service.create({
      email: 'new@test.com',
      password: 'password123',
      nickname: '새친구',
    });

    expect(managerMock.savedInvites).toHaveLength(0);
  });

  it('유효한 초대 코드로 가입하면 UserInvite가 생성된다', async () => {
    const inviter = { id: 'inviter1', myInviteCode: 'ABCD1234' } as User;
    const managerMock = createManagerMock({
      users: new Map([['inviter1', inviter]]),
    });
    const service = buildService(managerMock);

    await service.create({
      email: 'new@test.com',
      password: 'password123',
      nickname: '새친구',
      friendInviteCode: 'ABCD1234',
    });

    expect(managerMock.savedInvites).toHaveLength(1);
    expect(managerMock.savedInvites[0]).toEqual(
      expect.objectContaining({
        inviterUserId: 'inviter1',
        rewardGivenYn: false,
      }),
    );
  });

  it('존재하지 않는 초대 코드면 예외를 던진다', async () => {
    const managerMock = createManagerMock({ users: new Map() });
    const service = buildService(managerMock);

    await expect(
      service.create({
        email: 'new@test.com',
        password: 'password123',
        nickname: '새친구',
        friendInviteCode: 'NOPE0000',
      }),
    ).rejects.toMatchObject({ code: ErrorCode.INVITE_CODE_INVALID });
    expect(managerMock.savedInvites).toHaveLength(0);
  });
});
