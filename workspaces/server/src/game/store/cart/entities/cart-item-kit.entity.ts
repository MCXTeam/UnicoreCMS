import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Kit } from '../../entities/kit.entity';

@Entity()
export class CartItemKit {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Kit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn()
  kit: Kit;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  server: Server;

  @CreateDateColumn()
  created: Date

  @UpdateDateColumn()
  updated: Date
}
