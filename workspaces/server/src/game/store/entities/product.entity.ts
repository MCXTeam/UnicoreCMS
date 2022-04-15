import { StorageManager } from '@common';
import { Server } from 'src/game/servers/entities/server.entity';
import { AfterRemove, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { Kit } from './kit.entity';
import { Enchantment } from './enchantment.entity';
import { KitItem } from './kit-item.entity';
import { GiveMethod } from '../enums/give-method.enum';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  icon: string;

  @Column('longtext', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  nbt: string;

  @ManyToMany(() => Server, (server) => server.products)
  servers: Server[];

  @OneToMany(() => KitItem, (item) => item.product)
  kit_items: KitItem[];

  @ManyToMany(() => Category, (category) => category.products, {
    eager: true,
  })
  @JoinTable()
  categories: Category[];

  @ManyToMany(() => Enchantment, (enchantment) => enchantment.products)
  @JoinTable()
  enchantments: Enchantment[];

  @Column('float')
  price: number;

  @Column({ nullable: true })
  sale: number;

  @Column({ nullable: true })
  prevent_use_virtual: boolean

  @Column({ default: GiveMethod.UnicoreConnect })
  give_method: GiveMethod

  @Column({ nullable: true })
  item_id?: string;

  @Column('simple-array', { nullable: true })
  commands?: string[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
