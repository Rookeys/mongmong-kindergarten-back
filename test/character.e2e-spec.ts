import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ErrorCode } from '../src/common/error-code';
import { toKstDateString } from '../src/common/utils/to-kst-date-string.util';
import { CharacterService } from '../src/modules/character/character.service';
import { Character } from '../src/modules/character/entities/character.entity';
import { CharacterStatus } from '../src/modules/character/enums/character-status.enum';
import { addYearsToDateString } from '../src/modules/character/utils/add-years-to-date-string.util';
import { ItemType } from '../src/modules/item/enums/item-type.enum';
import { Item } from '../src/modules/item/entities/item.entity';
import { Letter } from '../src/modules/letter/entities/letter.entity';
import { MoodType } from '../src/modules/letter/enums/mood-type.enum';
import { User } from '../src/modules/user/entities/user.entity';
import {
  createItem,
  createTestModule,
  createUser,
} from './support/create-test-module';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TODAY = toKstDateString();

/** n일 전 KST 날짜 */
const toDateBefore = (days: number): string =>
  toKstDateString(new Date(Date.now() - days * MS_PER_DAY));

describe('캐릭터 (종류·레벨·졸업·꾸미기)', () => {
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let characterService: CharacterService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    dataSource = moduleRef.get(DataSource);
    characterService = moduleRef.get(CharacterService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  /** 질문 없이 편지 행만 넣는다 (레벨·기분 집계용) */
  async function insertLetters(
    userId: string,
    letters: { letterDate: string; mood?: MoodType }[],
  ): Promise<void> {
    const questionId = await ensureQuestion();
    await dataSource.getRepository(Letter).save(
      letters.map((letter) => ({
        userId,
        questionId,
        letterDate: letter.letterDate,
        answer: '편지',
        mood: letter.mood ?? null,
        isPrivate: true,
        isPrivateSns: true,
        localeType: 'ko',
      })) as never,
    );
  }

  async function ensureQuestion(): Promise<string> {
    const rows: { question_id: string }[] = await dataSource.query(
      'SELECT question_id FROM question LIMIT 1',
    );
    if (rows[0]) {
      return rows[0].question_id;
    }
    const [series] = await dataSource.query(
      `INSERT INTO question_series (title) VALUES ('테스트') RETURNING question_series_id`,
    );
    const [question] = await dataSource.query(
      'INSERT INTO question (question_series_id, order_num) VALUES ($1, 1) RETURNING question_id',
      [series.question_series_id],
    );
    return question.question_id;
  }

  /** 진행 중 캐릭터의 시작일을 바꾼다 */
  async function setCycleStartDate(
    userId: string,
    cycleStartDate: string,
  ): Promise<void> {
    await dataSource
      .getRepository(Character)
      .update({ userId, status: CharacterStatus.GROWING }, { cycleStartDate });
  }

  it('처음 조회하면 Lv1 캐릭터가 랜덤 종류로 생기고, 졸업일은 시작일 + 1년이다', async () => {
    const user = await createUser(moduleRef);

    const character = await characterService.findOrCreateMine(user.id);

    expect(['몽몽이', '햄몽이', '빼몽이']).toContain(
      character.characterType.name,
    );
    expect(character).toMatchObject({
      level: 1,
      letterCount: 0,
      nextLevelLetterCount: 90,
      cycleStartDate: TODAY,
      graduationDate: addYearsToDateString(TODAY, 1),
      canGraduate: false,
    });
  });

  it('사이클 동안 쓴 편지 90통마다 레벨이 오르고 사이클 밖 편지는 세지 않는다', async () => {
    const user = await createUser(moduleRef);
    await characterService.findOrCreateMine(user.id);
    await setCycleStartDate(user.id, toDateBefore(200));
    const cycleLetters = Array.from({ length: 180 }, (_, i) => ({
      letterDate: toDateBefore(i),
    }));
    await insertLetters(user.id, [
      ...cycleLetters,
      { letterDate: toDateBefore(201) },
    ]);

    const character = await characterService.findOrCreateMine(user.id);

    expect(character).toMatchObject({
      level: 3,
      letterCount: 180,
      nextLevelLetterCount: 270,
    });
  });

  it('졸업일 전에는 졸업할 수 없다', async () => {
    const user = await createUser(moduleRef);
    const character = await characterService.findOrCreateMine(user.id);

    await expect(characterService.graduate(user.id)).rejects.toMatchObject({
      code: ErrorCode.CHARACTER_GRADUATION_NOT_READY,
      details: { graduationDate: character.graduationDate },
    });
  });

  it('1년이 지나면 졸업 카드에 이름·편지 수·가장 많이 보낸 기분이 남고, 새 캐릭터는 오늘이 속한 사이클에서 시작한다', async () => {
    const user = await createUser(moduleRef);
    const before = await characterService.findOrCreateMine(user.id);
    const cycleStartDate = addYearsToDateString(toDateBefore(10), -1);
    await setCycleStartDate(user.id, cycleStartDate);
    await insertLetters(user.id, [
      {
        letterDate: addYearsToDateString(cycleStartDate, 0),
        mood: MoodType.SAD,
      },
      { letterDate: toDateBefore(30), mood: MoodType.GOOD },
      { letterDate: toDateBefore(20), mood: MoodType.GOOD },
      { letterDate: toDateBefore(15) },
    ]);

    const card = await characterService.graduate(user.id);
    const after = await characterService.findOrCreateMine(user.id);

    expect(card).toMatchObject({
      characterId: before.id,
      characterName: before.characterType.name,
      letterCount: 4,
      topMood: MoodType.GOOD,
      levelSnapshot: 1,
      periodStart: cycleStartDate,
      periodEnd: toDateBefore(11),
    });
    expect(after.id).not.toBe(before.id);
    expect(after.cycleStartDate).toBe(toDateBefore(10));
  });

  it('판매 중지된 아이템은 살 수 없고, 같은 유형을 장착하면 기존 장착은 풀린다', async () => {
    const user = await createUser(moduleRef, 100);
    const stopped = await createItem(moduleRef, 1);
    await dataSource
      .getRepository(Item)
      .update(stopped.id, { isOnSale: false });
    const firstFace = await createItem(moduleRef, 1, ItemType.FACE);
    const secondFace = await createItem(moduleRef, 1, ItemType.FACE);
    const firstMap = await characterService.purchaseItem(user.id, {
      itemId: firstFace.id,
    });
    const secondMap = await characterService.purchaseItem(user.id, {
      itemId: secondFace.id,
    });

    await characterService.updateEquip(user.id, firstMap.id, {
      isEquipped: true,
    });
    await characterService.updateEquip(user.id, secondMap.id, {
      isEquipped: true,
    });
    const owned = await characterService.findMyItems(user.id);

    await expect(
      characterService.purchaseItem(user.id, { itemId: stopped.id }),
    ).rejects.toMatchObject({ code: ErrorCode.ITEM_NOT_ON_SALE });
    expect(owned.map((item) => [item.id, item.isEquipped])).toEqual([
      [firstMap.id, false],
      [secondMap.id, true],
    ]);
    const actualUser = await dataSource
      .getRepository(User)
      .findOneByOrFail({ id: user.id });
    expect(actualUser.rewardCount).toBe(98);
  });
});
