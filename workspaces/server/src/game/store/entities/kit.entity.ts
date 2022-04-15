import { StorageManager } from '@common';
import { Server } from 'src/game/servers/entities/server.entity';
import { AfterRemove, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { KitItem } from './kit-item.entity';

@Entity()
export class Kit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('longtext', {
    nullable: true,
  })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column('float')
  price: number;

  @Column({ nullable: true })
  prevent_use_virtual: boolean

  @Column({ nullable: true })
  sale: number;

  @ManyToMany(() => Server, (server) => server.kits)
  servers: Server[];

  @ManyToMany(() => Category, (category) => category.kits, {
    eager: true,
  })
  @JoinTable()
  categories: Category[];

  @OneToMany(() => KitItem, (item) => item.kit, {
    cascade: ['insert', 'update'],
  })
  @JoinTable()
  items: KitItem[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
