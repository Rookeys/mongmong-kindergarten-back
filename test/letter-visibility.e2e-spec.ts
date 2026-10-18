import { TestingModule } from '@nestjs/testing';
import { ErrorCode } from '../src/common/error-code';
import { toKstDateString } from '../src/common/utils/to-kst-date-string.util';
import { AuthService } from '../src/modules/auth/auth.service';
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

  it('탈퇴한 사용자의 공개 일지는 휴게실에서 내려간다', async () => {
    const letterService = moduleRef.get(LetterService);
    const writer = await createUser(moduleRef);
    const viewer = await createUser(moduleRef);
    const letter = await letterService.create(writer.id, {
      answer: '탈퇴할 사람의 일지',
      isPrivate: false,
    });

    await moduleRef.get(AuthService).withdraw(writer.id);
    const publicLetters = await letterService.findPublic(viewer.id, {
      questionId: letter.questionId,
    });

    expect(publicLetters.map((item) => item.id)).not.toContain(letter.id);
  });

  it('일지를 이미 쓴 뒤에는 초대 코드를 등록할 수 없다', async () => {
    const inviter = await createUser(moduleRef);
    const invitee = await createUser(moduleRef);
    await moduleRef
      .get(LetterService)
      .create(invitee.id, { answer: '먼저 쓴 일지' });

    await expect(
      moduleRef
        .get(UserService)
        .registerInviteCode(invitee.id, inviter.myInviteCode),
    ).rejects.toMatchObject({ code: ErrorCode.INVITE_CODE_TOO_LATE });
  });
});
