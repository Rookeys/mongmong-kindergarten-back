import { NestFactory } from '@nestjs/core';
import { DataSource, EntityManager } from 'typeorm';
import { LocaleType } from '../common/enums/locale-type.enum';
import { AppModule } from '../modules/app/app.module';
import { CharacterType } from '../modules/character/entities/character-type.entity';
import { Item } from '../modules/item/entities/item.entity';
import { ItemType } from '../modules/item/enums/item-type.enum';
import { Question } from '../modules/question/entities/question.entity';
import { QuestionContent } from '../modules/question/entities/question-content.entity';
import { QuestionSeries } from '../modules/question/entities/question-series.entity';

const QUESTION_COUNT = 365;

const CHARACTER_NAMES = ['몽몽이', '햄몽이', '빼몽이'];

const SAMPLE_ITEMS: Pick<Item, 'name' | 'itemType' | 'imageUrl' | 'cost'>[] = [
  {
    name: '샘플 옷 2',
    itemType: ItemType.CLOTHES,
    imageUrl: 'https://example.com/items/clothes-2.png',
    cost: 10,
  },
  {
    name: '샘플 옷',
    itemType: ItemType.CLOTHES,
    imageUrl: 'https://example.com/items/clothes.png',
    cost: 15,
  },
  {
    name: '샘플 얼굴',
    itemType: ItemType.FACE,
    imageUrl: 'https://example.com/items/face.png',
    cost: 5,
  },
  {
    name: '샘플 배경',
    itemType: ItemType.BACKGROUND,
    imageUrl: 'https://example.com/items/background.png',
    cost: 20,
  },
];

/**
 * 개발 DB에 프론트 연동용 샘플 데이터를 넣는다. 여러 번 실행해도 이미 있는 데이터는 건드리지 않는다.
 * - 시리즈가 없으면 "샘플 시리즈"를 만들고, 첫 시리즈에 order_num 1~365 질문과 한국어 콘텐츠("샘플 질문 N")를 채운다
 * - 아이템이 하나도 없으면 유형별 샘플 아이템 4개를 넣는다
 * - 캐릭터 종류 몽몽이·햄몽이·빼몽이가 없으면 넣는다 (캐릭터를 만들려면 하나 이상 필요)
 */
async function seedDevData(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('운영 환경에서는 샘플 데이터를 넣지 않는다.');
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  await app.get(DataSource).transaction(async (manager) => {
    await seedQuestions(manager);
    await seedItems(manager);
    await seedCharacterTypes(manager);
  });
  await app.close();
}

async function seedQuestions(manager: EntityManager): Promise<void> {
  const [existingSeries] = await manager.find(QuestionSeries, {
    order: { id: 'ASC' },
    take: 1,
  });
  const series =
    existingSeries ??
    (await manager.save(QuestionSeries, { title: '샘플 시리즈' }));
  const orderNums = Array.from({ length: QUESTION_COUNT }, (_, i) => i + 1);
  await manager
    .createQueryBuilder()
    .insert()
    .into(Question)
    .values(
      orderNums.map((orderNum) => ({ questionSeriesId: series.id, orderNum })),
    )
    .orIgnore()
    .execute();
  const questions = await manager.findBy(Question, {
    questionSeriesId: series.id,
  });
  await manager
    .createQueryBuilder()
    .insert()
    .into(QuestionContent)
    .values(
      questions.map((question) => ({
        questionId: question.id,
        localeType: LocaleType.KO,
        content: `샘플 질문 ${question.orderNum}`,
      })),
    )
    .orIgnore()
    .execute();
  console.log(`질문: 시리즈 ${series.id}에 ${questions.length}개`);
}

async function seedCharacterTypes(manager: EntityManager): Promise<void> {
  await manager
    .createQueryBuilder()
    .insert()
    .into(CharacterType)
    .values(CHARACTER_NAMES.map((name) => ({ name })))
    .orIgnore()
    .execute();
  console.log(`캐릭터 종류: ${CHARACTER_NAMES.join(', ')}`);
}

async function seedItems(manager: EntityManager): Promise<void> {
  if ((await manager.count(Item)) > 0) {
    console.log('아이템: 이미 있어서 건너뜀');
    return;
  }
  await manager.save(Item, SAMPLE_ITEMS);
  console.log(`아이템: ${SAMPLE_ITEMS.length}개 추가`);
}

seedDevData().catch((error) => {
  console.error('샘플 데이터 입력 실패:', error);
  process.exit(1);
});
