import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { Kit } from './kit.entity';
import { Product } from './product.entity';

@Entity({ name: 'unicore_kit_items' })
export class KitItem {
  @PrimaryColumn({ name: 'product_id' })
  productId?: number;

  @ManyToOne(() => Product, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @PrimaryColumn({ name: 'kit_id' })
  kitId?: number;

  @ManyToOne(() => Kit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    orphanedRowAction: 'delete',
    nullable: false,
  })
  @JoinColumn({ name: 'kit_id' })
  kit?: Kit;

  @Column({ name: 'amount' })
  amount: number;
}
