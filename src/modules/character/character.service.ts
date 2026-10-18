import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import { toKstDateString } from '../../common/utils/to-kst-date-string.util';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Item } from '../item/entities/item.entity';
import { RewardType } from '../reward/enums/reward-type.enum';
import { RewardService } from '../reward/reward.service';
import {
  CreateCharacterItemRequestDto,
  GetCharacterItemResponseDto,
  GetCharacterResponseDto,
  GetGraduationCardResponseDto,
  UpdateCharacterItemRequestDto,
} from './dto';
import { Character } from './entities/character.entity';
import { CharacterItemMap } from './entities/character-item-map.entity';
import { GraduationCard } from './entities/graduation-card.entity';
import { CharacterStatus } from './enums/character-status.enum';

const INITIAL_LEVEL = 1;
const INITIAL_EXPERIENCE = 0;

type NewCharacter = Pick<
  Character,
  'userId' | 'level' | 'experience' | 'status' | 'graduatedAt' | 'lastWateredAt'
>;

/**
 * 캐릭터/아이템 서비스
 */
@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(CharacterItemMap)
    private readonly characterItemMapRepository: Repository<CharacterItemMap>,
    @InjectRepository(GraduationCard)
    private readonly graduationCardRepository: Repository<GraduationCard>,
    private readonly dataSource: DataSource,
    private readonly rewardService: RewardService,
  ) {}

  /**
   * 진행 중(GROWING)인 내 캐릭터를 조회한다. 없으면 새로 생성한다.
   */
  async findOrCreateMine(userId: string): Promise<GetCharacterResponseDto> {
    const character = await this.getOrCreateActiveCharacter(
      this.dataSource.manager,
      userId,
    );
    return this.mapCharacterToResponse(character);
  }

  /**
   * 내 캐릭터가 보유한 아이템 목록을 조회한다.
   */
  async findMyItems(userId: string): Promise<GetCharacterItemResponseDto[]> {
    const character = await this.getOrCreateActiveCharacter(
      this.dataSource.manager,
      userId,
    );
    const itemMaps = await this.characterItemMapRepository.find({
      where: { characterId: character.id },
      relations: ['item'],
      order: { createdDate: 'ASC' },
    });
    return itemMaps.map((itemMap) => this.mapCharacterItemToResponse(itemMap));
  }

  /**
   * 아이템을 구매한다. 리워드(꿈조각)가 부족하거나 이미 보유 중이면 실패한다.
   */
  async purchaseItem(
    userId: string,
    dto: CreateCharacterItemRequestDto,
  ): Promise<GetCharacterItemResponseDto> {
    const savedItemMap = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        // 잠금이 먼저여야 동시 구매가 같은 잔액을 읽지 않는다
        const user = await this.rewardService.lockUser(manager, userId);
        const character = await this.getOrCreateActiveCharacter(
          manager,
          userId,
        );
        const item = await manager.findOneBy(Item, { id: dto.itemId });
        if (!item) {
          throw AppException.withTarget(ErrorCode.ITEM_NOT_FOUND, {
            itemId: dto.itemId,
          });
        }
        const alreadyOwned = await manager.findOneBy(CharacterItemMap, {
          characterId: character.id,
          itemId: item.id,
        });
        if (alreadyOwned) {
          throw new AppException(
            ErrorCode.CHARACTER_ITEM_ALREADY_OWNED,
            { itemId: item.id },
            undefined,
            `이미 보유한 아이템입니다. (${item.name})`,
          );
        }
        this.rewardService.ensureSufficientBalance(user, item.cost);
        await this.rewardService.applyRewards(manager, user, [
          { type: RewardType.ITEM_PURCHASE, amount: -item.cost },
        ]);
        return manager.save(CharacterItemMap, {
          characterId: character.id,
          itemId: item.id,
          isEquipped: false,
        });
      },
    );
    const itemMap = await this.characterItemMapRepository.findOneOrFail({
      where: { id: savedItemMap.id },
      relations: ['item'],
    });
    return this.mapCharacterItemToResponse(itemMap);
  }

  /**
   * 아이템 장착/해제를 처리한다. 장착 시 같은 유형의 기존 장착 아이템은 자동 해제한다.
   */
  async updateEquip(
    userId: string,
    characterItemMapId: string,
    dto: UpdateCharacterItemRequestDto,
  ): Promise<GetCharacterItemResponseDto> {
    const savedItemMap = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        // 같은 유형 아이템 두 개를 동시에 장착해도 하나만 남도록 사용자 단위로 순서를 맞춘다
        await this.rewardService.lockUser(manager, userId);
        const character = await this.getOrCreateActiveCharacter(
          manager,
          userId,
        );
        const target = await manager.findOne(CharacterItemMap, {
          where: { id: characterItemMapId, characterId: character.id },
          relations: ['item'],
        });
        if (!target) {
          throw AppException.withTarget(ErrorCode.CHARACTER_ITEM_NOT_OWNED, {
            characterItemId: characterItemMapId,
          });
        }

        if (dto.isEquipped) {
          await this.unequipSameType(
            manager,
            character.id,
            target.item.itemType,
            target.id,
          );
        }
        target.isEquipped = dto.isEquipped;
        return manager.save(CharacterItemMap, target);
      },
    );
    const itemMap = await this.characterItemMapRepository.findOneOrFail({
      where: { id: savedItemMap.id },
      relations: ['item'],
    });
    return this.mapCharacterItemToResponse(itemMap);
  }

  /**
   * 현재 캐릭터를 졸업 처리하고 졸업 카드를 발급한 뒤, 새 캐릭터를 시작한다.
   */
  async graduate(userId: string): Promise<GetGraduationCardResponseDto> {
    const savedCard = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        const character = await manager.findOne(Character, {
          where: { userId, status: CharacterStatus.GROWING },
        });
        if (!character) {
          throw new AppException(ErrorCode.CHARACTER_NOT_FOUND);
        }

        const equippedItemMaps = await manager.find(CharacterItemMap, {
          where: { characterId: character.id, isEquipped: true },
          relations: ['item'],
        });

        const graduatedAt = new Date();
        // 동시 졸업 요청은 먼저 커밋된 쪽만 상태를 바꾸고, 나머지는 대상이 없어 실패한다
        const { affected } = await manager.update(
          Character,
          { id: character.id, status: CharacterStatus.GROWING },
          { status: CharacterStatus.GRADUATED, graduatedAt },
        );
        if (!affected) {
          throw new AppException(ErrorCode.CHARACTER_NOT_FOUND);
        }

        const card = await manager.save(GraduationCard, {
          userId,
          characterId: character.id,
          graduatedAt,
          levelSnapshot: character.level,
          equippedItemsSnapshot: {
            items: equippedItemMaps.map((itemMap) => ({
              itemId: itemMap.itemId,
              itemType: itemMap.item.itemType,
              name: itemMap.item.name,
              imageUrl: itemMap.item.imageUrl,
            })),
          },
          cardImageUrl: null,
          periodStart: toKstDateString(character.createdDate),
          periodEnd: toKstDateString(graduatedAt),
        });

        await manager.save(Character, this.buildNewCharacter(userId));

        return card;
      },
    );
    return this.mapGraduationCardToResponse(savedCard);
  }

  /**
   * 내 졸업 카드 목록을 조회한다.
   */
  async findMyGraduationCards(
    userId: string,
  ): Promise<GetGraduationCardResponseDto[]> {
    const cards = await this.graduationCardRepository.find({
      where: { userId },
      order: { graduatedAt: 'DESC' },
    });
    return cards.map((card) => this.mapGraduationCardToResponse(card));
  }

  private async getOrCreateActiveCharacter(
    manager: EntityManager,
    userId: string,
  ): Promise<Character> {
    const existing = await manager.findOneBy(Character, {
      userId,
      status: CharacterStatus.GROWING,
    });
    if (existing) {
      return existing;
    }
    // 동시 요청이 먼저 만들었으면 부분 유니크 인덱스에 걸려 무시되고, 그 캐릭터를 다시 읽는다
    await manager
      .createQueryBuilder()
      .insert()
      .into(Character)
      .values(this.buildNewCharacter(userId))
      .orIgnore()
      .execute();
    return manager.findOneByOrFail(Character, {
      userId,
      status: CharacterStatus.GROWING,
    });
  }

  private buildNewCharacter(userId: string): NewCharacter {
    return {
      userId,
      level: INITIAL_LEVEL,
      experience: INITIAL_EXPERIENCE,
      status: CharacterStatus.GROWING,
      graduatedAt: null,
      lastWateredAt: null,
    };
  }

  private async unequipSameType(
    manager: EntityManager,
    characterId: string,
    itemType: Item['itemType'],
    excludeItemMapId: string,
  ): Promise<void> {
    const equippedItemMaps = await manager.find(CharacterItemMap, {
      where: { characterId, isEquipped: true },
      relations: ['item'],
    });
    const sameTypeEquipped = equippedItemMaps.filter(
      (itemMap) =>
        itemMap.id !== excludeItemMapId && itemMap.item.itemType === itemType,
    );
    for (const itemMap of sameTypeEquipped) {
      itemMap.isEquipped = false;
      await manager.save(CharacterItemMap, itemMap);
    }
  }

  private mapCharacterToResponse(
    character: Character,
  ): GetCharacterResponseDto {
    return {
      id: character.id,
      level: character.level,
      experience: character.experience,
      status: character.status,
      graduatedAt: character.graduatedAt,
      lastWateredAt: character.lastWateredAt,
      createdDate: character.createdDate,
    };
  }

  private mapCharacterItemToResponse(
    itemMap: CharacterItemMap,
  ): GetCharacterItemResponseDto {
    return {
      id: itemMap.id,
      itemId: itemMap.itemId,
      itemName: itemMap.item.name,
      itemType: itemMap.item.itemType,
      imageUrl: itemMap.item.imageUrl,
      isEquipped: itemMap.isEquipped,
      createdDate: itemMap.createdDate,
    };
  }

  private mapGraduationCardToResponse(
    card: GraduationCard,
  ): GetGraduationCardResponseDto {
    return {
      id: card.id,
      characterId: card.characterId,
      graduatedAt: card.graduatedAt,
      levelSnapshot: card.levelSnapshot,
      equippedItemsSnapshot: card.equippedItemsSnapshot,
      cardImageUrl: card.cardImageUrl,
    };
  }
}
