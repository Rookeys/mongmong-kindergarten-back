import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocaleType } from '../../common/enums/locale-type.enum';
import { toKstDateString } from '../../common/utils/to-kst-date-string.util';
import { Letter } from '../letter/entities/letter.entity';
import { User } from '../user/entities/user.entity';
import {
  GetDailyQuestionRequestDto,
  GetDailyQuestionResponseDto,
  GetQuestionResponseDto,
  GetQuestionSeriesResponseDto,
} from './dto';
import { Question } from './entities/question.entity';
import { QuestionContent } from './entities/question-content.entity';
import { QuestionSeries } from './entities/question-series.entity';
import { toQuestionOrderNum } from './utils/to-question-order-num.util';

/**
 * 질문 조회 서비스
 * 질문은 달력 날짜에 고정된다(시리즈당 365문항, 같은 월/일은 매년 같은 질문).
 */
@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(QuestionSeries)
    private readonly questionSeriesRepository: Repository<QuestionSeries>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Letter)
    private readonly letterRepository: Repository<Letter>,
  ) {}

  /**
   * 질문 시리즈 목록을 조회한다.
   */
  async findAllSeries(): Promise<GetQuestionSeriesResponseDto[]> {
    const seriesList = await this.questionSeriesRepository.find({
      order: { createdDate: 'ASC' },
    });
    return seriesList.map((series) => ({
      id: series.id,
      title: series.title,
      description: series.description,
      thumbnailUrl: series.thumbnailUrl,
    }));
  }

  /**
   * 내 시리즈의 질문 전체를 순번(날짜) 오름차순으로 조회한다.
   */
  async findAll(
    userId: string,
    locale: LocaleType = LocaleType.KO,
  ): Promise<GetQuestionResponseDto[]> {
    const user = await this.findUser(userId);
    const questions = await this.questionRepository.find({
      where: {
        questionSeriesId: await this.resolveSeriesId(user.questionSeriesId),
      },
      relations: ['contents'],
      order: { orderNum: 'ASC' },
    });
    return questions.map((question) => {
      const content = this.pickContent(question, locale);
      return {
        id: question.id,
        orderNum: question.orderNum,
        content: content.content,
        localeType: content.localeType,
      };
    });
  }

  /**
   * 회원의 날짜별 질문을 조회한다. 날짜를 생략하면 오늘(KST)이다.
   */
  async findDaily(
    userId: string,
    query: GetDailyQuestionRequestDto,
  ): Promise<GetDailyQuestionResponseDto> {
    const date = query.date ?? toKstDateString();
    if (date > toKstDateString()) {
      throw new AppException(ErrorCode.DATE_IN_FUTURE);
    }
    const user = await this.findUser(userId);
    const question = await this.findByDate(user.questionSeriesId, date);
    const letter = await this.letterRepository.findOneBy({
      userId,
      letterDate: date,
    });
    return this.mapToDailyResponse(
      question,
      date,
      query.locale,
      letter?.id ?? null,
    );
  }

  /**
   * 비회원용: 기본 시리즈의 오늘(KST) 질문 하나만 조회한다.
   */
  async findGuestToday(
    locale?: LocaleType,
  ): Promise<GetDailyQuestionResponseDto> {
    const date = toKstDateString();
    const question = await this.findByDate(null, date);
    return this.mapToDailyResponse(question, date, locale, null);
  }

  /**
   * 시리즈와 날짜로 질문을 찾는다. 시리즈가 없으면(null) 기본 시리즈를 쓴다.
   */
  async findByDate(
    questionSeriesId: string | null,
    date: string,
  ): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: {
        questionSeriesId: await this.resolveSeriesId(questionSeriesId),
        orderNum: toQuestionOrderNum(date),
      },
      relations: ['contents'],
    });
    if (!question) {
      throw AppException.withTarget(ErrorCode.QUESTION_NOT_FOUND, { date });
    }
    return question;
  }

  private async findUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw AppException.withTarget(ErrorCode.USER_NOT_FOUND, {
        userId: userId,
      });
    }
    return user;
  }

  /** 시리즈를 고르지 않은 회원과 비회원은 가장 먼저 등록된 시리즈를 쓴다 */
  private async resolveSeriesId(
    questionSeriesId: string | null,
  ): Promise<string> {
    if (questionSeriesId) {
      return questionSeriesId;
    }
    const [defaultSeries] = await this.questionSeriesRepository.find({
      order: { id: 'ASC' },
      take: 1,
    });
    if (!defaultSeries) {
      throw new AppException(ErrorCode.QUESTION_SERIES_NOT_FOUND);
    }
    return defaultSeries.id;
  }

  /** 요청 로케일 콘텐츠를 고르고, 없으면 한국어로 대체한다 */
  private pickContent(question: Question, locale: LocaleType): QuestionContent {
    const content =
      question.contents.find((item) => item.localeType === locale) ??
      question.contents.find((item) => item.localeType === LocaleType.KO);
    if (!content) {
      throw AppException.withTarget(ErrorCode.QUESTION_CONTENT_NOT_FOUND, {
        questionId: question.id,
      });
    }
    return content;
  }

  private mapToDailyResponse(
    question: Question,
    date: string,
    locale: LocaleType = LocaleType.KO,
    letterId: string | null,
  ): GetDailyQuestionResponseDto {
    const content = this.pickContent(question, locale);
    return {
      id: question.id,
      questionSeriesId: question.questionSeriesId,
      orderNum: question.orderNum,
      date,
      content: content.content,
      localeType: content.localeType,
      letterId,
    };
  }
}
