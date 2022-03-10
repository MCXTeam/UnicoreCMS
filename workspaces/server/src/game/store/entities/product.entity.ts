import { StorageManager } from '@common';
import { Server } from 'src/game/servers/entities/server.entity';
import { AfterRemove, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { Kit } from './kit.entity';
import { Enchantment } from './enchantment.entity';
import { KitItem } from './kit-item.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  icon: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  nbt: string;

  @ManyToMany(() => Server, (server) => server.products)
  servers: Server[];

  @OneToMany(() => KitItem, (item) => item.product)
  kit_items: KitItem[];

  @ManyToMany(() => Category, (category) => category.products)
  @JoinTable()
  categories: Category[];

  @ManyToMany(() => Enchantment, (enchantment) => enchantment.products)
  @JoinTable()
  enchantments: Enchantment[];

  @Column('float')
  price: number;

  @Column({ nullable: true })
  sale: number;

  @Column()
  item_id: string;

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
