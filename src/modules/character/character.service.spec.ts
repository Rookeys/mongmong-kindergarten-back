import { ErrorCode } from '../../common/error-code';
import { DataSource } from 'typeorm';
import { Item } from '../item/entities/item.entity';
import { ItemType } from '../item/enums/item-type.enum';
import { RewardHistory } from '../reward/entities/reward-history.entity';
import { RewardType } from '../reward/enums/reward-type.enum';
import { RewardService } from '../reward/reward.service';
import { User } from '../user/entities/user.entity';
import { CharacterService } from './character.service';
import { Character } from './entities/character.entity';
import { CharacterItemMap } from './entities/character-item-map.entity';
import { GraduationCard } from './entities/graduation-card.entity';
import { CharacterStatus } from './enums/character-status.enum';

/**
 * dataSource.transaction(cb)이 넘겨주는 EntityManager를 흉내내는 인메모리 페이크.
 * 엔티티 클래스별 Map에 저장하고, CharacterItemMap 조회 시 relations:['item']을 해석해 item을 붙여준다.
 */
class FakeManager {
  private nextId = 1;
  characters = new Map<string, Character>();
  itemMaps = new Map<string, CharacterItemMap>();
  items = new Map<string, Item>();
  users = new Map<string, User>();
  graduationCards = new Map<string, GraduationCard>();
  rewardHistories = new Map<string, RewardHistory>();

  private storeFor(entity: unknown): Map<string, unknown> {
    if (entity === Character) return this.characters;
    if (entity === CharacterItemMap) return this.itemMaps;
    if (entity === Item) return this.items;
    if (entity === User) return this.users;
    if (entity === GraduationCard) return this.graduationCards;
    if (entity === RewardHistory) return this.rewardHistories;
    throw new Error(`unexpected entity: ${String(entity)}`);
  }

  private matches(
    row: Record<string, unknown>,
    where: Record<string, unknown>,
  ): boolean {
    return Object.entries(where).every(([key, value]) => row[key] === value);
  }

  private attachRelations(entity: unknown, row: Record<string, unknown>): void {
    if (entity === CharacterItemMap) {
      row.item = this.items.get(row.itemId as string);
    }
  }

  findOneBy = (entity: unknown, where: Record<string, unknown>) => {
    const store = this.storeFor(entity);
    return (
      Array.from(store.values()).find((row) =>
        this.matches(row as Record<string, unknown>, where),
      ) ?? null
    );
  };

  findOne = (
    entity: unknown,
    options: { where: Record<string, unknown>; relations?: string[] },
  ) => {
    const row = this.findOneBy(entity, options.where) as Record<
      string,
      unknown
    > | null;
    if (row && options.relations?.includes('item')) {
      this.attachRelations(entity, row);
    }
    return row;
  };

  find = (
    entity: unknown,
    options: { where: Record<string, unknown>; relations?: string[] },
  ) => {
    const store = this.storeFor(entity);
    const rows = Array.from(store.values()).filter((row) =>
      this.matches(row as Record<string, unknown>, options.where),
    ) as Record<string, unknown>[];
    if (options.relations?.includes('item')) {
      rows.forEach((row) => this.attachRelations(entity, row));
    }
    return rows;
  };

  findOneByOrFail = (entity: unknown, where: Record<string, unknown>) => {
    const row = this.findOneBy(entity, where);
    if (!row) {
      throw new Error('not found');
    }
    return row;
  };

  /** 조건에 맞는 행만 바꾸고 바뀐 행 수를 돌려준다 */
  update = (
    entity: unknown,
    where: Record<string, unknown>,
    patch: Record<string, unknown>,
  ) => {
    const rows = this.find(entity, { where });
    rows.forEach((row) => Object.assign(row, patch));
    return { affected: rows.length };
  };

  /** insert().into(Character).values(v).orIgnore(): 진행 중 캐릭터가 이미 있으면 무시 */
  createQueryBuilder = () => ({
    insert: () => ({
      into: (entity: unknown) => ({
        values: (payload: Record<string, unknown>) => ({
          orIgnore: () => ({
            execute: () => {
              const hasGrowing = this.findOneBy(entity, {
                userId: payload.userId,
                status: CharacterStatus.GROWING,
              });
              if (!hasGrowing) {
                this.save(entity, payload);
              }
            },
          }),
        }),
      }),
    }),
  });

  save = (entity: unknown, payload: Record<string, unknown> | unknown[]) => {
    if (Array.isArray(payload)) {
      return payload.map((row) =>
        this.save(entity, row as Record<string, unknown>),
      );
    }
    const store = this.storeFor(entity);
    const id = (payload.id as string) ?? `id-${this.nextId++}`;
    const existing = (store.get(id) as Record<string, unknown>) ?? {};
    const saved = {
      createdDate: new Date(),
      ...existing,
      ...payload,
      id,
    };
    store.set(id, saved);
    return saved;
  };

  getRepository = (entity: unknown) => ({
    findOneBy: (where: Record<string, unknown>) =>
      this.findOneBy(entity, where),
    save: (payload: Record<string, unknown>) => this.save(entity, payload),
    find: (options: { where: Record<string, unknown>; relations?: string[] }) =>
      this.find(entity, options),
    findOneOrFail: (options: {
      where: Record<string, unknown>;
      relations?: string[];
    }) => {
      const row = this.findOne(entity, options);
      if (!row) {
        throw new Error('not found');
      }
      return row;
    },
  });
}

function buildService(manager: FakeManager) {
  const dataSource = {
    manager,
    transaction: (cb: (manager: FakeManager) => unknown) => cb(manager),
  } as unknown as DataSource;
  return new CharacterService(
    manager.getRepository(CharacterItemMap) as never,
    manager.getRepository(GraduationCard) as never,
    dataSource,
    new RewardService({} as never, dataSource),
  );
}

function seedItem(manager: FakeManager, overrides: Partial<Item> = {}): Item {
  return manager.save(Item, {
    name: '왕관',
    itemType: ItemType.HAT,
    imageUrl: 'https://example.com/crown.png',
    cost: 50,
    ...overrides,
  }) as Item;
}

function seedUser(manager: FakeManager, overrides: Partial<User> = {}): User {
  return manager.save(User, { rewardCount: 100, ...overrides }) as User;
}

describe('CharacterService.findOrCreateMine', () => {
  it('캐릭터가 없으면 새로 생성한다', async () => {
    const manager = new FakeManager();
    const service = buildService(manager);

    const result = await service.findOrCreateMine('u1');

    expect(result.level).toBe(1);
    expect(result.status).toBe(CharacterStatus.GROWING);
    expect(manager.characters.size).toBe(1);
  });

  it('이미 GROWING 상태 캐릭터가 있으면 그대로 반환한다', async () => {
    const manager = new FakeManager();
    manager.save(Character, {
      userId: 'u1',
      level: 3,
      experience: 10,
      useYn: true,
      status: CharacterStatus.GROWING,
      graduatedAt: null,
      lastWateredAt: null,
    });
    const service = buildService(manager);

    const result = await service.findOrCreateMine('u1');

    expect(result.level).toBe(3);
    expect(manager.characters.size).toBe(1);
  });
});

describe('CharacterService.purchaseItem', () => {
  it('리워드가 충분하면 구매하고 rewardCount를 차감한다', async () => {
    const manager = new FakeManager();
    const item = seedItem(manager, { cost: 30 });
    const user = seedUser(manager, { id: 'u1', rewardCount: 100 });
    manager.users.set('u1', user);
    const service = buildService(manager);

    const result = await service.purchaseItem('u1', { itemId: item.id });

    expect(result.itemId).toBe(item.id);
    expect(result.isEquipped).toBe(false);
    expect((manager.users.get('u1') as User).rewardCount).toBe(70);
    expect(Array.from(manager.rewardHistories.values())).toContainEqual(
      expect.objectContaining({
        userId: 'u1',
        type: RewardType.ITEM_PURCHASE,
        amount: -30,
      }),
    );
  });

  it('리워드가 부족하면 BadRequestException을 던지고 차감하지 않는다', async () => {
    const manager = new FakeManager();
    const item = seedItem(manager, { cost: 999 });
    manager.users.set('u1', seedUser(manager, { id: 'u1', rewardCount: 10 }));
    const service = buildService(manager);

    await expect(
      service.purchaseItem('u1', { itemId: item.id }),
    ).rejects.toMatchObject({
      code: ErrorCode.REWARD_INSUFFICIENT,
      details: expect.objectContaining({ required: expect.any(Number) }),
      message: expect.stringContaining('필요'),
    });
    expect((manager.users.get('u1') as User).rewardCount).toBe(10);
  });

  it('이미 보유한 아이템은 다시 구매할 수 없다', async () => {
    const manager = new FakeManager();
    const item = seedItem(manager);
    manager.users.set('u1', seedUser(manager, { id: 'u1' }));
    const service = buildService(manager);
    await service.purchaseItem('u1', { itemId: item.id });

    await expect(
      service.purchaseItem('u1', { itemId: item.id }),
    ).rejects.toMatchObject({ code: ErrorCode.CHARACTER_ITEM_ALREADY_OWNED });
  });
});

describe('CharacterService.updateEquip', () => {
  it('같은 유형 아이템을 장착하면 기존 장착 아이템은 자동 해제된다', async () => {
    const manager = new FakeManager();
    seedUser(manager, { id: 'u1' });
    const character = manager.save(Character, {
      userId: 'u1',
      level: 1,
      experience: 0,
      useYn: true,
      status: CharacterStatus.GROWING,
      graduatedAt: null,
      lastWateredAt: null,
    }) as Character;
    const hat1 = seedItem(manager, { name: '왕관' });
    const hat2 = seedItem(manager, { name: '고깔모자' });
    const equippedMap = manager.save(CharacterItemMap, {
      characterId: character.id,
      itemId: hat1.id,
      isEquipped: true,
    }) as CharacterItemMap;
    const newMap = manager.save(CharacterItemMap, {
      characterId: character.id,
      itemId: hat2.id,
      isEquipped: false,
    }) as CharacterItemMap;
    const service = buildService(manager);

    const result = await service.updateEquip('u1', newMap.id, {
      isEquipped: true,
    });

    expect(result.isEquipped).toBe(true);
    expect(
      (manager.itemMaps.get(equippedMap.id) as CharacterItemMap).isEquipped,
    ).toBe(false);
  });
});

describe('CharacterService.graduate', () => {
  it('캐릭터를 졸업 처리하고 새 캐릭터를 생성한다', async () => {
    const manager = new FakeManager();
    manager.save(Character, {
      userId: 'u1',
      level: 5,
      experience: 999,
      useYn: true,
      status: CharacterStatus.GROWING,
      graduatedAt: null,
      lastWateredAt: null,
    });
    const service = buildService(manager);

    const card = await service.graduate('u1');

    expect(card.levelSnapshot).toBe(5);
    const characters = Array.from(manager.characters.values());
    expect(characters).toHaveLength(2);
    expect(
      characters.filter((c) => c.status === CharacterStatus.GROWING),
    ).toHaveLength(1);
    expect(
      characters.filter((c) => c.status === CharacterStatus.GRADUATED),
    ).toHaveLength(1);
  });

  it('졸업 가능한 캐릭터가 없으면 예외를 던진다', async () => {
    const manager = new FakeManager();
    const service = buildService(manager);

    await expect(service.graduate('u1')).rejects.toMatchObject({
      code: ErrorCode.CHARACTER_NOT_FOUND,
    });
  });
});
