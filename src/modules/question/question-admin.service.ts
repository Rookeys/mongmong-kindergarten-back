import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import { QUESTION_COUNT_PER_SERIES } from './constants/question.constants';
import {
  CreateQuestionSeriesRequestDto,
  GetQuestionSeriesResponseDto,
  QuestionInputDto,
  UpsertQuestionsResponseDto,
} from './dto';
import { Question } from './entities/question.entity';
import { QuestionContent } from './entities/question-content.entity';
import { QuestionSeries } from './entities/question-series.entity';

/**
 * 질문 등록 서비스 (관리자 API, CSV 일괄 입력 스크립트가 함께 쓴다)
 */
@Injectable()
export class QuestionAdminService {
  constructor(
    @InjectRepository(QuestionSeries)
    private readonly questionSeriesRepository: Repository<QuestionSeries>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 질문 시리즈를 만든다. 가장 먼저 만든 시리즈가 기본 시리즈다.
   */
  async createSeries(
    dto: CreateQuestionSeriesRequestDto,
  ): Promise<GetQuestionSeriesResponseDto> {
    const series = await this.questionSeriesRepository.save({
      title: dto.title,
      description: dto.description ?? null,
      thumbnailUrl: dto.thumbnailUrl ?? null,
    });
    return {
      id: series.id,
      title: series.title,
      description: series.description,
      thumbnailUrl: series.thumbnailUrl,
    };
  }

  /**
   * 질문을 순번 기준으로 한 번에 등록·수정한다. 이미 있는 순번·언어는 문구를 덮어쓴다.
   */
  async upsertQuestions(
    questionSeriesId: string,
    questions: QuestionInputDto[],
  ): Promise<UpsertQuestionsResponseDto> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      if (!(await manager.existsBy(QuestionSeries, { id: questionSeriesId }))) {
        throw AppException.withTarget(ErrorCode.QUESTION_SERIES_NOT_FOUND, {
          questionSeriesId: questionSeriesId,
        });
      }
      const orderNums = questions.map((question) => question.orderNum);
      await manager
        .createQueryBuilder()
        .insert()
        .into(Question)
        .values(orderNums.map((orderNum) => ({ questionSeriesId, orderNum })))
        .orIgnore()
        .execute();
      const savedQuestions = await manager.findBy(Question, {
        questionSeriesId,
        orderNum: In(orderNums),
      });
      const questionIdByOrderNum = new Map(
        savedQuestions.map((question) => [question.orderNum, question.id]),
      );
      await manager.upsert(
        QuestionContent,
        questions.flatMap((question) =>
          question.contents.map((content) => ({
            questionId: questionIdByOrderNum.get(question.orderNum),
            localeType: content.localeType,
            content: content.content,
          })),
        ),
        ['questionId', 'localeType'],
      );
      return {
        questionSeriesId,
        upsertedCount: new Set(orderNums).size,
        missingOrderNums: await this.findMissingOrderNums(
          manager,
          questionSeriesId,
        ),
      };
    });
  }

  private async findMissingOrderNums(
    manager: EntityManager,
    questionSeriesId: string,
  ): Promise<number[]> {
    const existing = new Set(
      (await manager.findBy(Question, { questionSeriesId })).map(
        (question) => question.orderNum,
      ),
    );
    return Array.from(
      { length: QUESTION_COUNT_PER_SERIES },
      (_, i) => i + 1,
    ).filter((orderNum) => !existing.has(orderNum));
  }
}
