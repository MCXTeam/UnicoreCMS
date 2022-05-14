import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Product } from '../../entities/product.entity';

@Entity({ name: "unicore_warehouse_items" })
export class WarehouseItem {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @ManyToOne(() => Product, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: "product_id" })
  product: Product;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: "user_uuid" })
  user: User;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: "server_id" })
  server: Server;

  @Column({ name: "amount" })
  amount: number;

  @CreateDateColumn({ name: "created" })
  created: Date;

  @UpdateDateColumn({ name: "updated" })
  updated: Date;
}
