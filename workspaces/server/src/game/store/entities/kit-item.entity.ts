import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { Kit } from './kit.entity';
import { Product } from './product.entity';

@Entity()
export class KitItem {
  @ManyToOne(() => Product, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
    eager: true,
    nullable: false,
  })
  @JoinColumn()
  product: Product;

  @ManyToOne(() => Kit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    orphanedRowAction: 'delete',
    primary: true,
    nullable: false,
  })
  @JoinColumn()
  kit?: Product;

  @Column()
  amount: number;
}
