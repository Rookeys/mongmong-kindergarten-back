import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, MoreThan, Repository } from 'typeorm';
import { LocaleType } from '../../common/enums/locale-type.enum';
import {
  INVITE_REWARD_AMOUNT,
  LETTER_REWARD_AMOUNT,
} from '../reward/constants/reward-amount.constants';
import { RewardHistory } from '../reward/entities/reward-history.entity';
import { RewardType } from '../reward/enums/reward-type.enum';
import { Question } from '../question/entities/question.entity';
import { User } from '../user/entities/user.entity';
import { UserInvite } from '../user/entities/user-invite.entity';
import {
  CreateLetterReactionRequestDto,
  CreateLetterReportRequestDto,
  CreateLetterRequestDto,
  GetAiReplyResponseDto,
  GetLetterReactionResponseDto,
  GetLetterReportResponseDto,
  GetLetterResponseDto,
  GetLettersRequestDto,
} from './dto';
import { AiReply } from './entities/ai-reply.entity';
import { Letter } from './entities/letter.entity';
import { LetterReaction } from './entities/letter-reaction.entity';
import { LetterReport } from './entities/letter-report.entity';
import { LetterReportStatus } from './enums/letter-report-status.enum';

const DEFAULT_LETTERS_TAKE = 20;

/**
 * 일지(편지) 서비스
 */
@Injectable()
export class LetterService {
  constructor(
    @InjectRepository(Letter)
    private readonly letterRepository: Repository<Letter>,
    @InjectRepository(AiReply)
    private readonly aiReplyRepository: Repository<AiReply>,
    @InjectRepository(LetterReaction)
    private readonly letterReactionRepository: Repository<LetterReaction>,
    @InjectRepository(LetterReport)
    private readonly letterReportRepository: Repository<LetterReport>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 내 일지 목록을 조회한다.
   */
  async findAllByUser(
    userId: string,
    query: GetLettersRequestDto,
  ): Promise<GetLetterResponseDto[]> {
    const letters = await this.letterRepository.find({
      where: { userId },
      order: { createdDate: 'DESC' },
      take: query.take ?? DEFAULT_LETTERS_TAKE,
      skip: query.skip ?? 0,
    });
    return letters.map((letter) => this.mapLetterToResponse(letter));
  }

  /**
   * 내 일지 단건을 조회한다.
   */
  async findOneByUser(
    userId: string,
    letterId: string,
  ): Promise<GetLetterResponseDto> {
    const letter = await this.letterRepository.findOneBy({
      id: letterId,
      userId,
    });
    if (!letter) {
      throw AppException.withTarget(ErrorCode.LETTER_NOT_FOUND, {
        letterId: letterId,
      });
    }
    return this.mapLetterToResponse(letter);
  }

  /**
   * 오늘의 질문에 대한 일지를 작성한다.
   * - 진행 중인 질문(currentQuestionId)을 소비하고 다음 질문으로 진행시킨다.
   * - 작성 리워드를 적립한다.
   * - 첫 일지 작성이고 대기 중인 친구 초대가 있으면 초대 리워드를 지급한다.
   */
  async create(
    userId: string,
    dto: CreateLetterRequestDto,
  ): Promise<GetLetterResponseDto> {
    const savedLetter = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        const user = await manager.findOneBy(User, { id: userId });
        if (!user) {
          throw AppException.withTarget(ErrorCode.USER_NOT_FOUND, {
            userId: userId,
          });
        }
        if (!user.currentQuestionId) {
          throw new AppException(ErrorCode.QUESTION_SERIES_NOT_SELECTED);
        }

        const isFirstLetter =
          (await manager.count(Letter, { where: { userId } })) === 0;

        const letter = await manager.save(Letter, {
          userId,
          questionId: user.currentQuestionId,
          answer: dto.answer,
          moodNumber: dto.moodNumber ?? null,
          isPrivate: dto.isPrivate ?? false,
          isPrivateSns: dto.isPrivateSns ?? false,
          localeType: dto.localeType ?? LocaleType.KO,
        });

        user.currentQuestionId = await this.resolveNextQuestionId(
          manager,
          user.currentQuestionId,
        );
        user.rewardCount += LETTER_REWARD_AMOUNT;
        await manager.save(User, user);
        await manager.save(RewardHistory, {
          userId,
          type: RewardType.LETTER,
          amount: LETTER_REWARD_AMOUNT,
        });

        if (isFirstLetter) {
          await this.grantPendingInviteReward(manager, user);
        }

        return letter;
      },
    );
    return this.mapLetterToResponse(savedLetter);
  }

  private async resolveNextQuestionId(
    manager: EntityManager,
    currentQuestionId: string,
  ): Promise<string | null> {
    const currentQuestion = await manager.findOneBy(Question, {
      id: currentQuestionId,
    });
    if (!currentQuestion) {
      return null;
    }
    const nextQuestion = await manager.findOne(Question, {
      where: {
        questionSeriesId: currentQuestion.questionSeriesId,
        orderNum: MoreThan(currentQuestion.orderNum),
      },
      order: { orderNum: 'ASC' },
    });
    return nextQuestion?.id ?? null;
  }

  private async grantPendingInviteReward(
    manager: EntityManager,
    invitee: User,
  ): Promise<void> {
    const pendingInvite = await manager.findOneBy(UserInvite, {
      inviteeUserId: invitee.id,
      rewardGivenYn: false,
    });
    if (!pendingInvite) {
      return;
    }

    const inviter = await manager.findOneBy(User, {
      id: pendingInvite.inviterUserId,
    });
    if (!inviter) {
      return;
    }

    inviter.rewardCount += INVITE_REWARD_AMOUNT;
    invitee.rewardCount += INVITE_REWARD_AMOUNT;
    await manager.save(User, inviter);
    await manager.save(User, invitee);
    await manager.save(RewardHistory, [
      {
        userId: inviter.id,
        type: RewardType.INVITE,
        amount: INVITE_REWARD_AMOUNT,
      },
      {
        userId: invitee.id,
        type: RewardType.INVITE,
        amount: INVITE_REWARD_AMOUNT,
      },
    ]);
    pendingInvite.rewardGivenYn = true;
    await manager.save(UserInvite, pendingInvite);
  }

  /**
   * 내 일지에 달린 AI 답장 목록을 조회한다.
   */
  async findAiReplies(
    userId: string,
    letterId: string,
  ): Promise<GetAiReplyResponseDto[]> {
    const letter = await this.letterRepository.findOneBy({
      id: letterId,
      userId,
    });
    if (!letter) {
      throw AppException.withTarget(ErrorCode.LETTER_NOT_FOUND, {
        letterId: letterId,
      });
    }
    const aiReplies = await this.aiReplyRepository.find({
      where: { letterId },
      order: { createdDate: 'ASC' },
    });
    return aiReplies.map((aiReply) => this.mapAiReplyToResponse(aiReply));
  }

  /**
   * AI 답장을 읽음 처리한다.
   */
  async markAiReplyAsRead(
    userId: string,
    aiReplyId: string,
  ): Promise<GetAiReplyResponseDto> {
    const aiReply = await this.aiReplyRepository.findOneBy({
      id: aiReplyId,
      userId,
    });
    if (!aiReply) {
      throw AppException.withTarget(ErrorCode.AI_REPLY_NOT_FOUND, {
        aiReplyId: aiReplyId,
      });
    }
    if (!aiReply.isRead) {
      aiReply.isRead = true;
      await this.aiReplyRepository.save(aiReply);
    }
    return this.mapAiReplyToResponse(aiReply);
  }

  /**
   * 편지에 반응(스티커)을 남긴다. 이미 반응을 남긴 경우 반응 유형을 갱신한다.
   */
  async addReaction(
    userId: string,
    letterId: string,
    dto: CreateLetterReactionRequestDto,
  ): Promise<GetLetterReactionResponseDto> {
    const letter = await this.findVisibleLetter(letterId, userId);
    const existing = await this.letterReactionRepository.findOneBy({
      letterId: letter.id,
      userId,
    });
    if (existing) {
      existing.reactionType = dto.reactionType;
      const saved = await this.letterReactionRepository.save(existing);
      return this.mapReactionToResponse(saved);
    }
    const created = await this.letterReactionRepository.save({
      letterId: letter.id,
      userId,
      reactionType: dto.reactionType,
    });
    return this.mapReactionToResponse(created);
  }

  /**
   * 편지를 신고한다. 본인 일지는 신고할 수 없다.
   */
  async addReport(
    userId: string,
    letterId: string,
    dto: CreateLetterReportRequestDto,
  ): Promise<GetLetterReportResponseDto> {
    if (
      (await this.letterRepository.findOneBy({ id: letterId, userId })) !== null
    ) {
      throw new AppException(ErrorCode.LETTER_REPORT_OWN_LETTER);
    }
    const letter = await this.findVisibleLetter(letterId, userId);
    const created = await this.letterReportRepository.save({
      letterId: letter.id,
      reporterUserId: userId,
      reasonType: dto.reasonType,
      reasonDetail: dto.reasonDetail ?? null,
      status: LetterReportStatus.PENDING,
    });
    return this.mapReportToResponse(created);
  }

  /**
   * 본인 일지이거나 비공개가 아닌 일지를 조회한다. 그 외에는 존재를 숨긴다.
   */
  private async findVisibleLetter(
    letterId: string,
    userId: string,
  ): Promise<Letter> {
    const letter = await this.letterRepository.findOneBy({ id: letterId });
    if (!letter || (letter.isPrivate && letter.userId !== userId)) {
      throw AppException.withTarget(ErrorCode.LETTER_NOT_FOUND, {
        letterId: letterId,
      });
    }
    return letter;
  }

  private mapAiReplyToResponse(aiReply: AiReply): GetAiReplyResponseDto {
    return {
      id: aiReply.id,
      letterId: aiReply.letterId,
      content: aiReply.content,
      isRead: aiReply.isRead,
      createdDate: aiReply.createdDate,
    };
  }

  private mapReactionToResponse(
    reaction: LetterReaction,
  ): GetLetterReactionResponseDto {
    return {
      id: reaction.id,
      letterId: reaction.letterId,
      reactionType: reaction.reactionType,
      createdDate: reaction.createdDate,
    };
  }

  private mapReportToResponse(
    report: LetterReport,
  ): GetLetterReportResponseDto {
    return {
      id: report.id,
      letterId: report.letterId,
      reasonType: report.reasonType,
      reasonDetail: report.reasonDetail,
      status: report.status,
      createdDate: report.createdDate,
    };
  }

  private mapLetterToResponse(letter: Letter): GetLetterResponseDto {
    return {
      id: letter.id,
      questionId: letter.questionId,
      answer: letter.answer,
      moodNumber: letter.moodNumber,
      isPrivate: letter.isPrivate,
      isPrivateSns: letter.isPrivateSns,
      localeType: letter.localeType,
      createdDate: letter.createdDate,
      updatedDate: letter.updatedDate,
    };
  }
}
