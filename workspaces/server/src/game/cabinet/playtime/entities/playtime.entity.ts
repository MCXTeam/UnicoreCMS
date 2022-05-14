import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, UpdateDateColumn } from 'typeorm';

@Entity({ name: "unicore_playtimes" })
export class Playtime {
  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: "user_uuid" })
  user: User;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
    primary: true,
  })
  server: Server;

  @Column({
    default: 0,
    name: "time"
  })
  time: number;

  @CreateDateColumn({ name: "created" })
  created: Date;

  @UpdateDateColumn({ name: "updated" })
  updated: Date;
}
