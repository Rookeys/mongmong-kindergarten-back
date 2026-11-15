import { TestingModule } from '@nestjs/testing';
import { ErrorCode } from '../src/common/error-code';
import { LocaleType } from '../src/common/enums/locale-type.enum';
import { QuestionAdminService } from '../src/modules/question/question-admin.service';
import { QuestionService } from '../src/modules/question/question.service';
import { createTestModule, createUser } from './support/create-test-module';

describe('질문 등록 (관리자)', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await createTestModule();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('순번별로 등록하고 다시 보내면 문구를 덮어쓰며, 빈 순번을 알려준다', async () => {
    const adminService = moduleRef.get(QuestionAdminService);
    const series = await adminService.createSeries({ title: '기본' });

    await adminService.upsertQuestions(series.id, [
      {
        orderNum: 1, // 1월 1일
        contents: [{ localeType: LocaleType.KO, content: '처음 문구' }],
      },
    ]);
    const result = await adminService.upsertQuestions(series.id, [
      {
        orderNum: 1, // 1월 1일
        contents: [
          { localeType: LocaleType.KO, content: '고친 문구' },
          { localeType: LocaleType.EN, content: 'Edited' },
        ],
      },
      {
        orderNum: 2,
        contents: [{ localeType: LocaleType.KO, content: '둘째 날' }],
      },
    ]);
    const questions = await moduleRef
      .get(QuestionService)
      .findAll((await createUser(moduleRef)).id, LocaleType.KO);

    expect(result.upsertedCount).toBe(2);
    expect(result.missingOrderNums).toHaveLength(363);
    expect(questions.map((question) => question.content)).toEqual([
      '고친 문구',
      '둘째 날',
    ]);
  });

  it('없는 시리즈에는 넣을 수 없다', async () => {
    await expect(
      moduleRef.get(QuestionAdminService).upsertQuestions('999999', [
        {
          orderNum: 1,
          contents: [{ localeType: LocaleType.KO, content: '문구' }],
        },
      ]),
    ).rejects.toMatchObject({ code: ErrorCode.QUESTION_SERIES_NOT_FOUND });
  });
});
