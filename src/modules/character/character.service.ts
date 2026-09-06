import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Item } from '../item/entities/item.entity';
import { User } from '../user/entities/user.entity';
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

/**
 * 캐릭터/아이템 서비스
 */
@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
    @InjectRepository(CharacterItemMap)
    private readonly characterItemMapRepository: Repository<CharacterItemMap>,
    @InjectRepository(GraduationCard)
    private readonly graduationCardRepository: Repository<GraduationCard>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 진행 중(GROWING)인 내 캐릭터를 조회한다. 없으면 새로 생성한다.
   */
  async findOrCreateMine(userId: string): Promise<GetCharacterResponseDto> {
    const character = await this.getOrCreateActiveCharacter(
      this.characterRepository,
      userId,
    );
    return this.mapCharacterToResponse(character);
  }

  /**
   * 내 캐릭터가 보유한 아이템 목록을 조회한다.
   */
  async findMyItems(userId: string): Promise<GetCharacterItemResponseDto[]> {
    const character = await this.getOrCreateActiveCharacter(
      this.characterRepository,
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
        const character = await this.getOrCreateActiveCharacter(
          manager.getRepository(Character),
          userId,
        );
        const item = await manager.findOneBy(Item, { id: dto.itemId });
        if (!item) {
          throw new NotFoundException('아이템을 찾을 수 없습니다.');
        }

        const alreadyOwned = await manager.findOneBy(CharacterItemMap, {
          characterId: character.id,
          itemId: item.id,
        });
        if (alreadyOwned) {
          throw new BadRequestException('이미 보유한 아이템입니다.');
        }

        const user = await manager.findOneBy(User, { id: userId });
        if (!user) {
          throw new NotFoundException('사용자를 찾을 수 없습니다.');
        }
        if (user.rewardCount < item.cost) {
          throw new BadRequestException('리워드(꿈조각)가 부족합니다.');
        }

        user.rewardCount -= item.cost;
        await manager.save(User, user);

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
        const character = await this.getOrCreateActiveCharacter(
          manager.getRepository(Character),
          userId,
        );
        const target = await manager.findOne(CharacterItemMap, {
          where: { id: characterItemMapId, characterId: character.id },
          relations: ['item'],
        });
        if (!target) {
          throw new NotFoundException('보유한 아이템을 찾을 수 없습니다.');
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
          throw new NotFoundException('졸업 가능한 캐릭터를 찾을 수 없습니다.');
        }

        const equippedItemMaps = await manager.find(CharacterItemMap, {
          where: { characterId: character.id, isEquipped: true },
          relations: ['item'],
        });

        const graduatedAt = new Date();
        character.status = CharacterStatus.GRADUATED;
        character.graduatedAt = graduatedAt;
        await manager.save(Character, character);

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
          periodStart: character.createdDate.toISOString().slice(0, 10),
          periodEnd: graduatedAt.toISOString().slice(0, 10),
        });

        await manager.save(Character, {
          userId,
          level: INITIAL_LEVEL,
          experience: INITIAL_EXPERIENCE,
          useYn: true,
          status: CharacterStatus.GROWING,
          graduatedAt: null,
          lastWateredAt: null,
        });

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
    repository: Repository<Character>,
    userId: string,
  ): Promise<Character> {
    const existing = await repository.findOneBy({
      userId,
      status: CharacterStatus.GROWING,
    });
    if (existing) {
      return existing;
    }
    return repository.save({
      userId,
      level: INITIAL_LEVEL,
      experience: INITIAL_EXPERIENCE,
      useYn: true,
      status: CharacterStatus.GROWING,
      graduatedAt: null,
      lastWateredAt: null,
    });
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
