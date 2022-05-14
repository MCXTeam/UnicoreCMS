import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Kit } from '../../entities/kit.entity';

@Entity({ name: "unicore_cart_item_kits" })
export class CartItemKit {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @ManyToOne(() => Kit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: "kit_id" })
  kit: Kit;

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

  @CreateDateColumn({ name: "created" })
  created: Date;

  @UpdateDateColumn({ name: "updated" })
  updated: Date;
}
