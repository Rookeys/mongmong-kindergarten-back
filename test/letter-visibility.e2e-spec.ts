import { TestingModule } from '@nestjs/testing';
import { toKstDateString } from '../src/common/utils/to-kst-date-string.util';
import { LetterService } from '../src/modules/letter/letter.service';
import { UserService } from '../src/modules/user/user.service';
import {
  createTestModule,
  createUser,
  seedQuestions,
} from './support/create-test-module';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const YESTERDAY = toKstDateString(new Date(Date.now() - MS_PER_DAY));

describe('일지 공개 여부와 내 설정', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    await seedQuestions(moduleRef);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('첫 일지는 비공개로 시작하고, "공개하기"를 고르면 다음 일지부터 공개로 시작한다', async () => {
    const letterService = moduleRef.get(LetterService);
    const userService = moduleRef.get(UserService);
    const user = await createUser(moduleRef, 3);

    const firstLetter = await letterService.create(user.id, {
      answer: '첫 일지',
    });
    await letterService.update(user.id, firstLetter.id, {
      isPrivate: false,
      isPrivateSns: false,
    });
    const nextLetter = await letterService.create(user.id, {
      answer: '다음 일지',
      letterDate: YESTERDAY,
    });

    expect(firstLetter).toMatchObject({ isPrivate: true, isPrivateSns: true });
    expect(await userService.findSetting(user.id)).toMatchObject({
      setLetterIsPrivate: false,
      setLetterIsPrivateSns: false,
    });
    expect(nextLetter).toMatchObject({ isPrivate: false, isPrivateSns: false });
  });
});
