import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ItemType } from '../enums/item-type.enum';

/**
 * 아이템 엔티티 (ITEM)
 */
@Entity('item')
export class Item {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'item_id' })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'item_type', type: 'varchar', length: 20 })
  itemType!: ItemType;

  @Column({ name: 'image_url', type: 'varchar', length: 500 })
  imageUrl!: string;

  @Column({ type: 'int', default: 0 })
  cost!: number;

  /** false면 판매 중지: 상점에서 숨기고 새로 살 수 없다. 이미 산 사람은 계속 갖고 있다 */
  @Column({ name: 'is_on_sale', type: 'boolean', default: true })
  isOnSale!: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate!: Date;
}
