import { ErrorCode } from '../../common/error-code';
import { UserRole } from '../user/enums/user-role.enum';
import { NoticeType } from './enums/notice-type.enum';
import { NoticeService } from './notice.service';

function buildService(notices: Array<Record<string, unknown>>) {
  const repository = {
    find: (options: { where: Record<string, unknown> }) =>
      Promise.resolve(
        notices.filter((notice) =>
          Object.entries(options.where).every(
            ([key, value]) => value === undefined || notice[key] === value,
          ),
        ),
      ),
    findOneBy: (where: Record<string, unknown>) =>
      Promise.resolve(
        notices.find((notice) =>
          Object.entries(where).every(([key, value]) => notice[key] === value),
        ) ?? null,
      ),
  };
  return new NoticeService(repository as never);
}

describe('NoticeService.findAll', () => {
  const notices = [
    { id: '1', type: NoticeType.NOTICE, isPublished: true },
    { id: '2', type: NoticeType.NOTICE, isPublished: false },
  ];

  it('일반 사용자는 게시된 공지만 조회한다', async () => {
    const service = buildService(notices);

    const result = await service.findAll({}, UserRole.USER);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('관리자는 필터를 지정하지 않으면 비게시 공지도 조회한다', async () => {
    const service = buildService(notices);

    const result = await service.findAll({}, UserRole.ADMIN);

    expect(result).toHaveLength(2);
  });
});

describe('NoticeService.findOne', () => {
  const notices = [{ id: '2', type: NoticeType.NOTICE, isPublished: false }];

  it('일반 사용자가 비게시 공지를 조회하면 찾을 수 없다', async () => {
    const service = buildService(notices);

    await expect(service.findOne('2', UserRole.USER)).rejects.toMatchObject({
      code: ErrorCode.NOTICE_NOT_FOUND,
    });
  });

  it('관리자는 비게시 공지도 조회할 수 있다', async () => {
    const service = buildService(notices);

    const result = await service.findOne('2', UserRole.ADMIN);

    expect(result.id).toBe('2');
  });
});
