import { StorageManager } from '@common';
import { AfterRemove, Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: "unicore_enchantments" })
export class Enchantment {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "name" })
  name: string;

  @Column('text', {
    name: "description",
    nullable: true,
  })
  description: string;

  @Column('float', { name: "price" })
  price: number;

  @Column({ nullable: true, name: "icon" })
  icon: string;

  @ManyToMany(() => Product, (product) => product.enchantments, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  products: Product[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
