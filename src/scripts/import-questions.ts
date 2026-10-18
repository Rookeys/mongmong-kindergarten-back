import { NestFactory } from '@nestjs/core';
import { readFileSync } from 'fs';
import { LocaleType } from '../common/enums/locale-type.enum';
import { parseCsv } from '../common/utils/parse-csv.util';
import { AppModule } from '../modules/app/app.module';
import { QUESTION_COUNT_PER_SERIES } from '../modules/question/constants/question.constants';
import { QuestionInputDto } from '../modules/question/dto';
import { QuestionAdminService } from '../modules/question/question-admin.service';

const HEADER = ['order_num', 'locale_type', 'content'];

/** 빈 순번은 앞에서부터 이만큼만 보여준다 */
const MISSING_PREVIEW_COUNT = 20;

/**
 * CSV 파일의 질문을 시리즈에 한 번에 넣는다. 이미 있는 순번·언어는 덮어쓴다.
 *
 * 사용법: pnpm import:questions <시리즈ID> <CSV 경로>
 * CSV 형식(첫 줄은 헤더): order_num,locale_type,content
 *   - order_num: 1~365 (1월 1일 = 1)
 *   - locale_type: ko | en | ja
 *   - content: 질문 문구 (쉼표·줄바꿈이 있으면 큰따옴표로 감싼다)
 * 접속 DB는 NODE_ENV(기본 development)의 .env 파일을 따른다.
 */
async function importQuestions(): Promise<void> {
  const [questionSeriesId, csvPath] = process.argv.slice(2);
  if (!questionSeriesId || !csvPath) {
    throw new Error('사용법: pnpm import:questions <시리즈ID> <CSV 경로>');
  }
  const questions = toQuestionInputs(parseCsv(readFileSync(csvPath, 'utf8')));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  const result = await app
    .get(QuestionAdminService)
    .upsertQuestions(questionSeriesId, questions);
  await app.close();
  console.log(
    `시리즈 ${result.questionSeriesId}: ${result.upsertedCount}개 등록·수정`,
  );
  console.log(
    result.missingOrderNums.length === 0
      ? '빈 날짜 없음'
      : `아직 비어 있는 순번 ${result.missingOrderNums.length}개: ${result.missingOrderNums.slice(0, MISSING_PREVIEW_COUNT).join(', ')}${result.missingOrderNums.length > MISSING_PREVIEW_COUNT ? ' ...' : ''}`,
  );
}

/** CSV 행을 순번별 질문으로 묶는다. 잘못된 행이 있으면 줄 번호와 함께 멈춘다 */
function toQuestionInputs(rows: string[][]): QuestionInputDto[] {
  const [header, ...body] = rows;
  if (header?.map((cell) => cell.trim()).join(',') !== HEADER.join(',')) {
    throw new Error(`첫 줄은 ${HEADER.join(',')} 이어야 합니다.`);
  }
  const byOrderNum = new Map<number, QuestionInputDto>();
  body.forEach(([orderNumText, localeText, content], index) => {
    const lineNumber = index + 2;
    const orderNum = Number(orderNumText);
    const localeType = localeText?.trim() as LocaleType;
    if (
      !Number.isInteger(orderNum) ||
      orderNum < 1 ||
      orderNum > QUESTION_COUNT_PER_SERIES
    ) {
      throw new Error(`${lineNumber}번째 줄: order_num은 1~365 정수`);
    }
    if (!Object.values(LocaleType).includes(localeType)) {
      throw new Error(
        `${lineNumber}번째 줄: locale_type은 ${Object.values(LocaleType).join(' | ')}`,
      );
    }
    if (!content?.trim()) {
      throw new Error(`${lineNumber}번째 줄: content가 비어 있음`);
    }
    const question = byOrderNum.get(orderNum) ?? { orderNum, contents: [] };
    question.contents.push({ localeType, content: content.trim() });
    byOrderNum.set(orderNum, question);
  });
  return [...byOrderNum.values()];
}

importQuestions().catch((error) => {
  console.error('질문 입력 실패:', error);
  process.exit(1);
});
