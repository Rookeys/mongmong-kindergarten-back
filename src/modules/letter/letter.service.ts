import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  Between,
  DataSource,
  EntityManager,
  LessThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { toKstDateString } from '../../common/utils/to-kst-date-string.util';
import { LocaleType } from '../../common/enums/locale-type.enum';
import {
  INVITE_REWARD_AMOUNT,
  LETTER_REWARD_AMOUNT,
  PAST_LETTER_COST,
  STREAK_DAYS,
  STREAK_REWARD_AMOUNT,
} from '../reward/constants/reward-amount.constants';
import { RewardHistory } from '../reward/entities/reward-history.entity';
import { RewardType } from '../reward/enums/reward-type.enum';
import { QuestionService } from '../question/question.service';
import { User } from '../user/entities/user.entity';
import { UserInvite } from '../user/entities/user-invite.entity';
import {
  CreateLetterReactionRequestDto,
  CreateLetterReportRequestDto,
  CreateLetterRequestDto,
  CreateLetterResponseDto,
  GetAiReplyResponseDto,
  GetLetterCalendarRequestDto,
  GetLetterCalendarResponseDto,
  GetLetterReactionResponseDto,
  GetLetterReportResponseDto,
  GetLetterResponseDto,
  GetLettersRequestDto,
  GetPublicLetterResponseDto,
  GetPublicLettersRequestDto,
  UpdateLetterRequestDto,
} from './dto';
import { AiReply } from './entities/ai-reply.entity';
import { Letter } from './entities/letter.entity';
import { LetterReaction } from './entities/letter-reaction.entity';
import { LetterReport } from './entities/letter-report.entity';
import { LetterReportStatus } from './enums/letter-report-status.enum';

const DEFAULT_LETTERS_TAKE = 20;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
    private readonly questionService: QuestionService,
  ) {}

  /**
   * 내 일지 목록을 조회한다.
   */
  async findAllByUser(
    userId: string,
    query: GetLettersRequestDto,
  ): Promise<GetLetterResponseDto[]> {
    const letters = await this.letterRepository.find({
      where: {
        userId,
        ...(query.questionId ? { questionId: query.questionId } : {}),
      },
      // 같은 질문의 이전 기록은 오래된 순으로 보여준다
      order: { letterDate: query.questionId ? 'ASC' : 'DESC' },
      take: query.take ?? DEFAULT_LETTERS_TAKE,
      skip: query.skip ?? 0,
    });
    return letters.map((letter) => this.mapLetterToResponse(letter));
  }

  /**
   * 휴게실: 같은 질문에 다른 사람이 쓴 공개 일지를 최신순으로 조회한다.
   * 내 일지, 비공개 일지, 내가 차단한 사용자의 일지는 제외한다.
   */
  async findPublic(
    userId: string,
    query: GetPublicLettersRequestDto,
  ): Promise<GetPublicLetterResponseDto[]> {
    const letters = await this.letterRepository
      .createQueryBuilder('letter')
      .where('letter.questionId = :questionId', {
        questionId: query.questionId,
      })
      .andWhere('letter.isPrivate = false')
      .andWhere('letter.userId != :userId', { userId })
      .andWhere(
        'letter.userId NOT IN (SELECT ub.blocked_user_id FROM user_block ub WHERE ub.blocker_user_id = :userId)',
      )
      .orderBy('letter.createdDate', 'DESC')
      .take(query.take ?? DEFAULT_LETTERS_TAKE)
      .skip(query.skip ?? 0)
      .getMany();
    return letters.map((letter) => ({
      id: letter.id,
      questionId: letter.questionId,
      answer: letter.answer,
      createdDate: letter.createdDate,
    }));
  }

  /**
   * 월간 캘린더: 해당 월에 일지가 있는 날짜 목록을 조회한다.
   */
  async findCalendar(
    userId: string,
    query: GetLetterCalendarRequestDto,
  ): Promise<GetLetterCalendarResponseDto[]> {
    const toMonthStart = (year: number, month: number): string =>
      `${year}-${String(month).padStart(2, '0')}-01`;
    const isDecember = query.month === 12;
    const letters = await this.letterRepository.find({
      where: {
        userId,
        letterDate: And(
          MoreThanOrEqual(toMonthStart(query.year, query.month)),
          LessThan(
            toMonthStart(
              isDecember ? query.year + 1 : query.year,
              isDecember ? 1 : query.month + 1,
            ),
          ),
        ),
      },
      order: { letterDate: 'ASC' },
    });
    return letters.map((letter) => ({
      date: letter.letterDate,
      letterId: letter.id,
      moodNumber: letter.moodNumber,
    }));
  }

  /**
   * 내 일지를 부분 수정한다. 본문(answer)은 작성 당일(KST)에만 고칠 수 있다.
   */
  async update(
    userId: string,
    letterId: string,
    dto: UpdateLetterRequestDto,
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
    if (
      dto.answer !== undefined &&
      toKstDateString(letter.createdDate) !== toKstDateString()
    ) {
      throw new AppException(ErrorCode.LETTER_EDIT_EXPIRED);
    }
    letter.answer = dto.answer ?? letter.answer;
    letter.moodNumber = dto.moodNumber ?? letter.moodNumber;
    letter.isPrivate = dto.isPrivate ?? letter.isPrivate;
    letter.isPrivateSns = dto.isPrivateSns ?? letter.isPrivateSns;
    const savedLetter = await this.letterRepository.save(letter);
    return this.mapLetterToResponse(savedLetter);
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
   * 일지를 작성한다. 질문은 letterDate(달력 날짜)로 정해지고 하루에 한 통만 쓸 수 있다.
   * - 오늘 일지: 작성 리워드 지급, 연속 작성 보상 확인
   * - 지난 날짜 일지: 리워드를 차감하고 작성 리워드는 주지 않는다
   * - 첫 일지라면 대기 중인 친구 초대 리워드를 지급한다
   */
  async create(
    userId: string,
    dto: CreateLetterRequestDto,
  ): Promise<CreateLetterResponseDto> {
    const today = toKstDateString();
    const letterDate = dto.letterDate ?? today;
    if (letterDate > today) {
      throw new AppException(ErrorCode.DATE_IN_FUTURE);
    }
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const user = await manager.findOneBy(User, { id: userId });
      if (!user) {
        throw AppException.withTarget(ErrorCode.USER_NOT_FOUND, {
          userId: userId,
        });
      }
      if (await manager.findOneBy(Letter, { userId, letterDate })) {
        throw AppException.withTarget(ErrorCode.LETTER_ALREADY_EXISTS, {
          letterDate,
        });
      }
      const question = await this.questionService.findByDate(
        user.questionSeriesId,
        letterDate,
      );
      const isToday = letterDate === today;
      if (!isToday && user.rewardCount < PAST_LETTER_COST) {
        throw new AppException(
          ErrorCode.REWARD_INSUFFICIENT,
          { required: PAST_LETTER_COST, current: user.rewardCount },
          undefined,
          `리워드(꿈조각)가 부족합니다. (필요 ${PAST_LETTER_COST}개, 보유 ${user.rewardCount}개)`,
        );
      }
      const isFirstLetter =
        (await manager.count(Letter, { where: { userId } })) === 0;

      const letter = await manager.save(Letter, {
        userId,
        questionId: question.id,
        letterDate,
        answer: dto.answer,
        moodNumber: dto.moodNumber ?? null,
        // 공개 여부는 작성 뒤에 묻는다. 묻기 전에 휴게실에 노출되지 않도록 기본은 비공개
        isPrivate: dto.isPrivate ?? true,
        isPrivateSns: dto.isPrivateSns ?? true,
        localeType: dto.localeType ?? LocaleType.KO,
      });

      const rewards = isToday
        ? [
            { type: RewardType.LETTER, amount: LETTER_REWARD_AMOUNT },
            ...((await this.isStreakRewardDue(manager, userId))
              ? [{ type: RewardType.STREAK, amount: STREAK_REWARD_AMOUNT }]
              : []),
          ]
        : [{ type: RewardType.PAST_LETTER, amount: -PAST_LETTER_COST }];
      const rewardAmount = rewards.reduce(
        (sum, reward) => sum + reward.amount,
        0,
      );
      user.rewardCount += rewardAmount;
      await manager.save(User, user);
      await manager.save(
        RewardHistory,
        rewards.map((reward) => ({ userId, ...reward })),
      );

      if (isFirstLetter) {
        await this.grantPendingInviteReward(manager, user);
      }

      return { ...this.mapLetterToResponse(letter), rewardAmount };
    });
  }

  /**
   * 오늘 일지로 연속 작성 보상을 받을 차례인지 확인한다.
   * 직전 (STREAK_DAYS - 1)일을 모두 썼고, 그 기간에 이미 받은 연속 보상이 없어야 한다.
   * (5일마다 반복 지급. 오늘 일지는 저장된 뒤에 호출된다)
   */
  private async isStreakRewardDue(
    manager: EntityManager,
    userId: string,
  ): Promise<boolean> {
    const toDateBefore = (days: number): string =>
      toKstDateString(new Date(Date.now() - days * MS_PER_DAY));
    const streakStartDate = toDateBefore(STREAK_DAYS - 1);
    const previousLetterCount = await manager.count(Letter, {
      where: {
        userId,
        letterDate: Between(streakStartDate, toDateBefore(1)),
      },
    });
    if (previousLetterCount < STREAK_DAYS - 1) {
      return false;
    }
    const recentStreakReward = await manager.findOne(RewardHistory, {
      where: {
        userId,
        type: RewardType.STREAK,
        createdDate: MoreThanOrEqual(
          new Date(`${streakStartDate}T00:00:00+09:00`),
        ),
      },
    });
    return !recentStreakReward;
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
      letterDate: letter.letterDate,
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
