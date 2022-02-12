import { StorageManager } from "@common";
import { AfterRemove, Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity()
export class Enchantment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', {
    nullable: true
  })
  description: string;

  @Column('float')
  price: number;

  @Column({ nullable: true })
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
