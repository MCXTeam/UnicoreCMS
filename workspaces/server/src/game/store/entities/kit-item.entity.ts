import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { Kit } from './kit.entity';
import { Product } from './product.entity';

@Entity({ name: "unicore_kit_items" })
export class KitItem {
  @ManyToOne(() => Product, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: "product_id" })
  product: Product;

  @ManyToOne(() => Kit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    orphanedRowAction: 'delete',
    primary: true,
    nullable: false,
  })
  @JoinColumn({ name: "kit_id" })
  kit?: Kit;

  @Column({ name: "amount" })
  amount: number;
}
