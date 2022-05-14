import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, UpdateDateColumn } from 'typeorm';

@Entity({ name: "unicore_monies" })
export class Money {
  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
    primary: true,
  })
  @JoinColumn({ name: "server_id" })
  server: Server;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: "user_uuid" })
  user: User;

  @Column('float', { name: "money", default: 0 })
  money: number;

  @CreateDateColumn({ name: "created" })
  created: Date;

  @UpdateDateColumn({ name: "updated" })
  updated: Date;
}
