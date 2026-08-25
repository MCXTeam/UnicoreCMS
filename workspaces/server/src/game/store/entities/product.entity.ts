import { MONEY_PRECISION, MONEY_SCALE, StorageManager, decimalColumn, stringArrayColumn } from '@common';
import { Server } from 'src/game/servers/entities/server.entity';
import { AfterRemove, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { Enchantment } from './enchantment.entity';
import { KitItem } from './kit-item.entity';
import { GiveMethod } from '../enums/give-method.enum';
import { Translatable } from 'src/admin/locales/translatable.decorator';

@Translatable('product', ['name', 'description'])
@Entity({ name: 'unicore_products' })
export class Product {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'giftable', default: true })
  giftable: boolean;

  @Column({ nullable: true, name: 'icon' })
  icon: string;

  @Column('longtext', { nullable: true, name: 'description' })
  description: string;

  @Column('text', { nullable: true, name: 'nbt' })
  nbt: string;

  @ManyToMany(() => Server, (server) => server.products)
  servers: Server[];

  @OneToMany(() => KitItem, (item) => item.product)
  kit_items: KitItem[];

  @ManyToMany(() => Category, (category) => category.products, {
    eager: true,
  })
  @JoinTable({
    name: 'unicore_products_categories',
    joinColumn: {
      name: 'product_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'category_id',
      referencedColumnName: 'id',
    },
  })
  categories: Category[];

  @ManyToMany(() => Enchantment, (enchantment) => enchantment.products)
  @JoinTable({
    name: 'unicore_products_enchantments',
    joinColumn: {
      name: 'product_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'enchantment_id',
      referencedColumnName: 'id',
    },
  })
  enchantments: Enchantment[];

  @Column('decimal', { name: 'price', precision: MONEY_PRECISION, scale: MONEY_SCALE, transformer: decimalColumn })
  price: number;

  @Column({ nullable: true, name: 'sale' })
  sale: number;

  @Column({ nullable: true, name: 'virtual_percent' })
  virtual_percent?: number;

  @Column({ nullable: true, name: 'multiple_of' })
  multiple_of?: number;

  @Column({ default: GiveMethod.UnicoreConnect, name: 'give_method' })
  give_method: GiveMethod;

  @Column({ nullable: true, name: 'item_id' })
  item_id?: string;

  @Column({ type: 'text', nullable: true, name: 'commands', transformer: stringArrayColumn })
  commands?: string[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
