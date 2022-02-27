import { StorageManager } from '@common';
import { AfterRemove, Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Kit } from './kit.entity';
import { Product } from './product.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', {
    nullable: true,
  })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @ManyToMany(() => Product, (product) => product.categories, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  products: Product[];

  @ManyToMany(() => Kit, (kit) => kit.categories, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  kits: Kit[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
