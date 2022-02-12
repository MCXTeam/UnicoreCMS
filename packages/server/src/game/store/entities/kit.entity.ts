import { StorageManager } from '@common';
import { Server } from 'src/game/servers/entities/server.entity';
import { AfterRemove, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { Product } from './product.entity';

@Entity()
export class Kit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', {
    nullable: true
  })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column('float')
  price: number;

  @Column({ nullable: true })
  sale: number;

  @ManyToMany(() => Server, (server) => server.kits)
  servers: Server[];

  @ManyToMany(() => Category, (category) => category.kits)
  @JoinTable()
  categories: Category[];

  @ManyToMany(() => Product, (product) => product.kits, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable()
  products: Product[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
