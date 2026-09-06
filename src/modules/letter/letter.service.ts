import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  CreateLetterRequestDto,
  GetLetterResponseDto,
  GetLettersRequestDto,
} from './dto';
import { Letter } from './entities/letter.entity';

const DEFAULT_LETTERS_TAKE = 20;

/**
 * 일지(편지) 서비스
 */
@Injectable()
export class LetterService {
  constructor(
    @InjectRepository(Letter)
    private readonly letterRepository: Repository<Letter>,
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
      throw new NotFoundException('일지를 찾을 수 없습니다.');
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
          throw new NotFoundException('사용자를 찾을 수 없습니다.');
        }
        if (!user.currentQuestionId) {
          throw new BadRequestException(
            '오늘의 질문이 없습니다. 질문 시리즈를 먼저 선택해주세요.',
          );
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
