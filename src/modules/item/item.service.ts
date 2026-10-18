import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import { assignDefined } from '../../common/utils/assign-defined.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateItemRequestDto,
  DeleteItemResponseDto,
  GetItemResponseDto,
  GetItemsRequestDto,
  UpdateItemRequestDto,
} from './dto';
import { UserRole } from '../user/enums/user-role.enum';
import { Item } from './entities/item.entity';

/**
 * 아이템 서비스
 */
@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  /**
   * 아이템 목록을 조회한다.
   */
  async findAll(
    query: GetItemsRequestDto,
    requesterRole: UserRole,
  ): Promise<GetItemResponseDto[]> {
    const isAdmin = requesterRole === UserRole.ADMIN;
    const items = await this.itemRepository.find({
      where: {
        ...(query.itemType ? { itemType: query.itemType } : {}),
        isOnSale: isAdmin ? query.isOnSale : true,
      },
      order: { createdDate: 'ASC' },
    });
    return items.map((item) => this.mapItemToResponse(item));
  }

  /**
   * id로 아이템을 조회한다.
   */
  async findById(itemId: string): Promise<Item> {
    const item = await this.itemRepository.findOneBy({ id: itemId });
    if (!item) {
      throw AppException.withTarget(ErrorCode.ITEM_NOT_FOUND, {
        itemId: itemId,
      });
    }
    return item;
  }

  /**
   * 아이템을 생성한다.
   */
  async create(dto: CreateItemRequestDto): Promise<GetItemResponseDto> {
    const savedItem = await this.itemRepository.save(dto);
    return this.mapItemToResponse(savedItem);
  }

  /**
   * 아이템을 부분 수정한다.
   */
  async update(
    itemId: string,
    dto: UpdateItemRequestDto,
  ): Promise<GetItemResponseDto> {
    const item = await this.findById(itemId);
    assignDefined(item, dto);
    const savedItem = await this.itemRepository.save(item);
    return this.mapItemToResponse(savedItem);
  }

  /**
   * 아이템 판매를 중지한다. 행은 지우지 않아 이미 산 사람은 계속 갖고 있다.
   */
  async stopSale(itemId: string): Promise<DeleteItemResponseDto> {
    const item = await this.findById(itemId);
    item.isOnSale = false;
    await this.itemRepository.save(item);
    return {
      message: '아이템 판매를 중지했습니다.',
      id: itemId,
      statusCode: 200,
    };
  }

  private mapItemToResponse(item: Item): GetItemResponseDto {
    return {
      id: item.id,
      name: item.name,
      itemType: item.itemType,
      imageUrl: item.imageUrl,
      cost: item.cost,
      isOnSale: item.isOnSale,
      createdDate: item.createdDate,
      updatedDate: item.updatedDate,
    };
  }
}
