import { TestingModule } from '@nestjs/testing';
import { DataSource, In } from 'typeorm';
import { ErrorCode } from '../src/common/error-code';
import { toKstDateString } from '../src/common/utils/to-kst-date-string.util';
import { AuthService } from '../src/modules/auth/auth.service';
import { CharacterService } from '../src/modules/character/character.service';
import { Character } from '../src/modules/character/entities/character.entity';
import { CharacterItemMap } from '../src/modules/character/entities/character-item-map.entity';
import { GraduationCard } from '../src/modules/character/entities/graduation-card.entity';
import { CharacterStatus } from '../src/modules/character/enums/character-status.enum';
import { addYearsToDateString } from '../src/modules/character/utils/add-years-to-date-string.util';
import { LetterReaction } from '../src/modules/letter/entities/letter-reaction.entity';
import { LetterReactionType } from '../src/modules/letter/enums/letter-reaction-type.enum';
import { LetterService } from '../src/modules/letter/letter.service';
import { INVITE_REWARD_AMOUNT } from '../src/modules/reward/constants/reward-amount.constants';
import { RewardHistory } from '../src/modules/reward/entities/reward-history.entity';
import { AdType } from '../src/modules/reward/enums/ad-type.enum';
import { RewardType } from '../src/modules/reward/enums/reward-type.enum';
import { RewardService } from '../src/modules/reward/reward.service';
import { User } from '../src/modules/user/entities/user.entity';
import { LoginType } from '../src/modules/user/enums/login-type.enum';
import {
  createItem,
  createTestModule,
  createUser,
  seedQuestions,
  sumRewardHistory,
} from './support/create-test-module';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const YESTERDAY = toKstDateString(new Date(Date.now() - MS_PER_DAY));

/** 같은 요청을 동시에 보내고 성공/실패 결과를 모은다 */
async function runConcurrently<T>(
  tasks: (() => Promise<T>)[],
): Promise<{ fulfilled: T[]; rejected: unknown[] }> {
  const results = await Promise.allSettled(tasks.map((task) => task()));
  return {
    fulfilled: results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value),
    rejected: results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason as unknown),
  };
}

/** 같은 요청을 count번 동시에 보낸다 */
function repeat<T>(
  count: number,
  task: () => Promise<T>,
): (() => Promise<T>)[] {
  return Array.from({ length: count }, () => task);
}

describe('동시 요청(중복 POST)', () => {
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let characterService: CharacterService;
  let letterService: LetterService;
  let rewardService: RewardService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    dataSource = moduleRef.get(DataSource);
    characterService = moduleRef.get(CharacterService);
    letterService = moduleRef.get(LetterService);
    rewardService = moduleRef.get(RewardService);
    await seedQuestions(moduleRef);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('캐릭터 조회를 동시에 보내도 진행 중 캐릭터는 1개만 생긴다', async () => {
    const user = await createUser(moduleRef);

    const { fulfilled } = await runConcurrently(
      repeat(5, () => characterService.findOrCreateMine(user.id)),
    );

    expect(fulfilled).toHaveLength(5);
    expect(new Set(fulfilled.map((character) => character.id)).size).toBe(1);
    expect(
      await dataSource.getRepository(Character).countBy({
        userId: user.id,
        status: CharacterStatus.GROWING,
      }),
    ).toBe(1);
  });

  it('졸업을 동시에 보내도 졸업 카드 1장, 새 캐릭터 1개만 생긴다', async () => {
    const user = await createUser(moduleRef);
    await characterService.findOrCreateMine(user.id);
    // 1년 사이클이 끝난 캐릭터로 만든다
    await dataSource
      .getRepository(Character)
      .update(
        { userId: user.id },
        { cycleStartDate: addYearsToDateString(toKstDateString(), -1) },
      );

    const { fulfilled, rejected } = await runConcurrently(
      repeat(3, () => characterService.graduate(user.id)),
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toEqual([
      expect.objectContaining({ code: ErrorCode.CHARACTER_NOT_FOUND }),
      expect.objectContaining({ code: ErrorCode.CHARACTER_NOT_FOUND }),
    ]);
    expect(
      await dataSource
        .getRepository(GraduationCard)
        .countBy({ userId: user.id }),
    ).toBe(1);
    expect(
      await dataSource.getRepository(Character).countBy({
        userId: user.id,
        status: CharacterStatus.GROWING,
      }),
    ).toBe(1);
  });

  it('잔액보다 비싼 조합을 동시에 사면 하나만 성공하고 잔액이 음수가 되지 않는다', async () => {
    const user = await createUser(moduleRef, 10);
    const cheapItem = await createItem(moduleRef, 5);
    const expensiveItem = await createItem(moduleRef, 8);

    const { fulfilled, rejected } = await runConcurrently([
      () => characterService.purchaseItem(user.id, { itemId: cheapItem.id }),
      () =>
        characterService.purchaseItem(user.id, { itemId: expensiveItem.id }),
    ]);

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toEqual([
      expect.objectContaining({ code: ErrorCode.REWARD_INSUFFICIENT }),
    ]);
    const actualUser = await dataSource
      .getRepository(User)
      .findOneByOrFail({ id: user.id });
    expect(actualUser.rewardCount).toBeGreaterThanOrEqual(0);
    expect(actualUser.rewardCount).toBe(
      10 + (await sumRewardHistory(moduleRef, user.id)),
    );
  });

  it('같은 아이템을 동시에 사면 한 번만 차감된다', async () => {
    const user = await createUser(moduleRef, 100);
    const item = await createItem(moduleRef, 30);

    const { fulfilled, rejected } = await runConcurrently(
      repeat(3, () =>
        characterService.purchaseItem(user.id, { itemId: item.id }),
      ),
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(2);
    const actualUser = await dataSource
      .getRepository(User)
      .findOneByOrFail({ id: user.id });
    expect(actualUser.rewardCount).toBe(70);
  });

  it('광고 보상을 동시에 받아도 잔액이 유실되지 않는다', async () => {
    const user = await createUser(moduleRef);

    await runConcurrently(
      repeat(5, () =>
        rewardService.recordAdView(user.id, { adType: AdType.REWARDED }),
      ),
    );

    const actualUser = await dataSource
      .getRepository(User)
      .findOneByOrFail({ id: user.id });
    expect(actualUser.rewardCount).toBe(
      await sumRewardHistory(moduleRef, user.id),
    );
    expect(
      await dataSource
        .getRepository(RewardHistory)
        .countBy({ userId: user.id, type: RewardType.AD }),
    ).toBe(5);
  });

  it('출석체크를 동시에 보내도 한 번만 지급한다', async () => {
    const user = await createUser(moduleRef);

    const { fulfilled, rejected } = await runConcurrently(
      repeat(3, () => rewardService.checkAttendance(user.id)),
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toEqual([
      expect.objectContaining({ code: ErrorCode.ATTENDANCE_ALREADY_CHECKED }),
      expect.objectContaining({ code: ErrorCode.ATTENDANCE_ALREADY_CHECKED }),
    ]);
  });

  it('같은 날짜 일지를 동시에 쓰면 하나만 저장된다', async () => {
    const user = await createUser(moduleRef);

    const { fulfilled, rejected } = await runConcurrently(
      repeat(3, () => letterService.create(user.id, { answer: '오늘' })),
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toEqual([
      expect.objectContaining({ code: ErrorCode.LETTER_ALREADY_EXISTS }),
      expect.objectContaining({ code: ErrorCode.LETTER_ALREADY_EXISTS }),
    ]);
  });

  it('첫 일지를 다른 날짜로 동시에 써도 초대 보상은 한 번만 나간다', async () => {
    const inviter = await createUser(moduleRef);
    const invitee = await createUser(moduleRef, 3, inviter.myInviteCode);

    const { fulfilled } = await runConcurrently([
      () => letterService.create(invitee.id, { answer: '오늘' }),
      () =>
        letterService.create(invitee.id, {
          answer: '어제',
          letterDate: YESTERDAY,
        }),
    ]);

    expect(fulfilled).toHaveLength(2);
    expect(
      await dataSource
        .getRepository(RewardHistory)
        .countBy({ userId: inviter.id, type: RewardType.INVITE }),
    ).toBe(1);
    const actualInviter = await dataSource
      .getRepository(User)
      .findOneByOrFail({ id: inviter.id });
    expect(actualInviter.rewardCount).toBe(INVITE_REWARD_AMOUNT);
  });

  it('같은 유형 아이템 두 개를 동시에 장착해도 하나만 장착된다', async () => {
    const user = await createUser(moduleRef, 100);
    const firstHat = await createItem(moduleRef, 1);
    const secondHat = await createItem(moduleRef, 2);
    const firstMap = await characterService.purchaseItem(user.id, {
      itemId: firstHat.id,
    });
    const secondMap = await characterService.purchaseItem(user.id, {
      itemId: secondHat.id,
    });

    await runConcurrently([
      () =>
        characterService.updateEquip(user.id, firstMap.id, {
          isEquipped: true,
        }),
      () =>
        characterService.updateEquip(user.id, secondMap.id, {
          isEquipped: true,
        }),
    ]);

    expect(
      await dataSource.getRepository(CharacterItemMap).countBy({
        id: In([firstMap.id, secondMap.id]),
        isEquipped: true,
      }),
    ).toBe(1);
  });

  it('반응을 동시에 보내도 모두 성공하고 행은 1개다', async () => {
    const writer = await createUser(moduleRef);
    const viewer = await createUser(moduleRef);
    const letter = await letterService.create(writer.id, {
      answer: '공개 일지',
      isPrivate: false,
    });

    const { fulfilled } = await runConcurrently(
      repeat(3, () =>
        letterService.addReaction(viewer.id, letter.id, {
          reactionType: LetterReactionType.LIKE,
        }),
      ),
    );

    expect(fulfilled).toHaveLength(3);
    expect(
      await dataSource
        .getRepository(LetterReaction)
        .countBy({ letterId: letter.id, userId: viewer.id }),
    ).toBe(1);
  });

  it('카카오 첫 로그인을 동시에 보내도 모두 같은 사용자로 로그인된다', async () => {
    const authService = moduleRef.get(AuthService);

    const { fulfilled, rejected } = await runConcurrently(
      repeat(3, () => authService.loginWithKakao('fake-kakao-token')),
    );

    expect(rejected).toEqual([]);
    expect(new Set(fulfilled.map((response) => response.user.id)).size).toBe(1);
    expect(
      await dataSource
        .getRepository(User)
        .countBy({ loginType: LoginType.KAKAO }),
    ).toBe(1);
  });
});
