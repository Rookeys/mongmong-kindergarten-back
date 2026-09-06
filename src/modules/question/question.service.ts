import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocaleType } from '../../common/enums/locale-type.enum';
import { User } from '../user/entities/user.entity';
import {
  GetQuestionSeriesResponseDto,
  GetTodayQuestionResponseDto,
} from './dto';
import { Question } from './entities/question.entity';
import { QuestionContent } from './entities/question-content.entity';
import { QuestionSeries } from './entities/question-series.entity';

/**
 * 질문 조회 서비스
 */
@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(QuestionSeries)
    private readonly questionSeriesRepository: Repository<QuestionSeries>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionContent)
    private readonly questionContentRepository: Repository<QuestionContent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
   * 사용자의 오늘의 질문을 조회한다.
   * currentQuestionId가 없으면 선택한 시리즈의 첫 질문으로 초기화한다.
   */
  async findToday(
    userId: string,
    locale?: LocaleType,
  ): Promise<GetTodayQuestionResponseDto> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const question = await this.resolveCurrentQuestion(user);
    const content = await this.resolveContent(
      question.id,
      locale ?? LocaleType.KO,
    );

    return {
      id: question.id,
      questionSeriesId: question.questionSeriesId,
      orderNum: question.orderNum,
      content: content.content,
      localeType: content.localeType,
    };
  }

  private async resolveCurrentQuestion(user: User): Promise<Question> {
    if (user.currentQuestionId) {
      const currentQuestion = await this.questionRepository.findOneBy({
        id: user.currentQuestionId,
      });
      if (currentQuestion) {
        return currentQuestion;
      }
    }

    if (!user.questionSeriesId) {
      throw new BadRequestException('질문 시리즈를 먼저 선택해주세요.');
    }

    const firstQuestion = await this.questionRepository.findOne({
      where: { questionSeriesId: user.questionSeriesId },
      order: { orderNum: 'ASC' },
    });
    if (!firstQuestion) {
      throw new NotFoundException('시리즈에 등록된 질문이 없습니다.');
    }

    await this.userRepository.update(user.id, {
      currentQuestionId: firstQuestion.id,
    });
    return firstQuestion;
  }

  private async resolveContent(
    questionId: string,
    locale: LocaleType,
  ): Promise<QuestionContent> {
    const content = await this.questionContentRepository.findOneBy({
      questionId,
      localeType: locale,
    });
    if (content) {
      return content;
    }
    if (locale === LocaleType.KO) {
      throw new NotFoundException('질문 콘텐츠를 찾을 수 없습니다.');
    }
    const fallback = await this.questionContentRepository.findOneBy({
      questionId,
      localeType: LocaleType.KO,
    });
    if (!fallback) {
      throw new NotFoundException('질문 콘텐츠를 찾을 수 없습니다.');
    }
    return fallback;
  }
}
