import { StorageManager } from '@common';
import { AfterRemove, Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Kit } from './kit.entity';
import { Product } from './product.entity';

@Entity({
  name: "unicore_categories",
  orderBy: {
    priority: "DESC",
    name: "ASC"
  }
})
export class Category {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "name" })
  name: string;

  @Column({ name: "priority", nullable: true })
  priority: number;

  @Column('text', {
    name: "description",
    nullable: true,
  })
  description: string;

  @Column({ name: "icon", nullable: true })
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
