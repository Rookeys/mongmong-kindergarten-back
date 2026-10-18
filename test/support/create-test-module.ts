import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LocaleType } from '../../src/common/enums/locale-type.enum';
import { toKstDateString } from '../../src/common/utils/to-kst-date-string.util';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { KakaoAuthService } from '../../src/modules/auth/services/kakao-auth.service';
import { CharacterModule } from '../../src/modules/character/character.module';
import { CharacterType } from '../../src/modules/character/entities/character-type.entity';
import { Item } from '../../src/modules/item/entities/item.entity';
import { ItemType } from '../../src/modules/item/enums/item-type.enum';
import { ItemModule } from '../../src/modules/item/item.module';
import { LetterModule } from '../../src/modules/letter/letter.module';
import { Question } from '../../src/modules/question/entities/question.entity';
import { QuestionContent } from '../../src/modules/question/entities/question-content.entity';
import { QuestionSeries } from '../../src/modules/question/entities/question-series.entity';
import { QuestionModule } from '../../src/modules/question/question.module';
import { toQuestionOrderNum } from '../../src/modules/question/utils/to-question-order-num.util';
import { RewardModule } from '../../src/modules/reward/reward.module';
import { User } from '../../src/modules/user/entities/user.entity';
import { UserModule } from '../../src/modules/user/user.module';
import { UserService } from '../../src/modules/user/user.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DEFAULT_CHARACTER_NAMES = ['몽몽이', '햄몽이', '빼몽이'];

/** 카카오 API 대신 쓰는 고정 프로필 */
export const FAKE_KAKAO_ID = 990001;

/**
 * 실제 PostgreSQL(테스트 DB)에 붙는 테스트 모듈을 만든다. 시작할 때 스키마를 지운다.
 * 접속 정보: TEST_DB_HOST/PORT/USERNAME/PASSWORD/DATABASE (기본 localhost, 현재 OS 사용자, mongmong_kindergarten_test)
 */
export async function createTestModule(): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [() => ({ JWT_SECRET: 'e2e-secret' })],
      }),
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.TEST_DB_HOST ?? 'localhost',
        port: Number(process.env.TEST_DB_PORT ?? 5432),
        username: process.env.TEST_DB_USERNAME ?? process.env.USER,
        password: process.env.TEST_DB_PASSWORD,
        database: process.env.TEST_DB_DATABASE ?? 'mongmong_kindergarten_test',
        autoLoadEntities: true,
        synchronize: true,
        dropSchema: true,
      }),
      UserModule,
      AuthModule,
      QuestionModule,
      ItemModule,
      LetterModule,
      CharacterModule,
      RewardModule,
    ],
  })
    .overrideProvider(KakaoAuthService)
    .useValue({
      fetchUserProfile: () => Promise.resolve({ id: FAKE_KAKAO_ID }),
      extractEmail: () => null,
    })
    .compile();
  await moduleRef
    .get(DataSource)
    .getRepository(CharacterType)
    .save(DEFAULT_CHARACTER_NAMES.map((name) => ({ name })));
  return moduleRef;
}

let userSequence = 0;

/** 로컬 사용자를 만들고 잔액을 맞춘다 */
export async function createUser(
  moduleRef: TestingModule,
  rewardCount = 0,
  friendInviteCode?: string,
): Promise<User> {
  userSequence += 1;
  const created = await moduleRef.get(UserService).create({
    email: `user${userSequence}@example.com`,
    password: 'password123',
    nickname: `테스트${userSequence}`,
    friendInviteCode,
  });
  const repository = moduleRef.get(DataSource).getRepository(User);
  await repository.update(created.id, { rewardCount });
  return repository.findOneByOrFail({ id: created.id });
}

/** 기본 시리즈와 오늘·어제 질문을 넣는다 */
export async function seedQuestions(moduleRef: TestingModule): Promise<void> {
  const dataSource = moduleRef.get(DataSource);
  const series = await dataSource
    .getRepository(QuestionSeries)
    .save({ title: '테스트 시리즈' });
  const dates = [0, 1].map((days) =>
    toKstDateString(new Date(Date.now() - days * MS_PER_DAY)),
  );
  for (const date of dates) {
    const question = await dataSource.getRepository(Question).save({
      questionSeriesId: series.id,
      orderNum: toQuestionOrderNum(date),
    });
    await dataSource.getRepository(QuestionContent).save({
      questionId: question.id,
      localeType: LocaleType.KO,
      content: `${date} 질문`,
    });
  }
}

/** 아이템을 하나 만든다 */
export async function createItem(
  moduleRef: TestingModule,
  cost: number,
  itemType: ItemType = ItemType.CLOTHES,
): Promise<Item> {
  return moduleRef
    .get(DataSource)
    .getRepository(Item)
    .save({
      name: `아이템${cost}`,
      itemType,
      imageUrl: 'https://example.com/item.png',
      cost,
    });
}

/** reward_history 합계가 user.reward_count와 같은지 확인할 때 쓴다 */
export async function sumRewardHistory(
  moduleRef: TestingModule,
  userId: string,
): Promise<number> {
  const rows: { total: string | null }[] = await moduleRef
    .get(DataSource)
    .query(
      'SELECT SUM(amount) AS total FROM reward_history WHERE user_id = $1',
      [userId],
    );
  return Number(rows[0].total ?? 0);
}
