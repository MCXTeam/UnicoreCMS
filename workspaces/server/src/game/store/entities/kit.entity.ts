import { StorageManager } from '@common';
import { Server } from 'src/game/servers/entities/server.entity';
import { AfterRemove, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { KitItem } from './kit-item.entity';

@Entity({ name: "unicore_kits" })
export class Kit {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "name" })
  name: string;

  @Column('longtext', {
    name: "description",
    nullable: true,
  })
  description: string;

  @Column({ name: "icon", nullable: true })
  icon: string;

  @Column('float', { name: "price" })
  price: number;

  @Column({ nullable: true, name: "virtual_percent" })
  virtual_percent?: number

  @Column({ nullable: true, name: "sale" })
  sale: number;

  @ManyToMany(() => Server, (server) => server.kits)
  servers: Server[];

  @ManyToMany(() => Category, (category) => category.kits, {
    eager: true,
  })
  @JoinTable({
    name: "unicore_kits_categories",
    joinColumn: {
        name: "kit_id",
        referencedColumnName: "id"
    },
    inverseJoinColumn: {
        name: "category_id",
        referencedColumnName: "id"
    }
  })
  categories: Category[];

  @OneToMany(() => KitItem, (item) => item.kit, {
    cascade: ['insert', 'update'],
  })
  items: KitItem[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
