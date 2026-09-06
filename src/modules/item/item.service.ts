import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateItemRequestDto,
  DeleteItemResponseDto,
  GetItemResponseDto,
  GetItemsRequestDto,
  UpdateItemRequestDto,
} from './dto';
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
  async findAll(query: GetItemsRequestDto): Promise<GetItemResponseDto[]> {
    const items = await this.itemRepository.find({
      where: query.itemType ? { itemType: query.itemType } : {},
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
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
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
    Object.assign(item, dto);
    const savedItem = await this.itemRepository.save(item);
    return this.mapItemToResponse(savedItem);
  }

  /**
   * 아이템을 삭제한다.
   */
  async remove(itemId: string): Promise<DeleteItemResponseDto> {
    await this.findById(itemId);
    await this.itemRepository.delete(itemId);
    return {
      message: '아이템 삭제를 완료했습니다.',
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
      createdDate: item.createdDate,
      updatedDate: item.updatedDate,
    };
  }
}
