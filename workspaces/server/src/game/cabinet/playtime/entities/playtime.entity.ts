import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'unicore_playtimes' })
export class Playtime {
  @PrimaryColumn({ name: 'user_uuid' })
  userUuid: string;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid' })
  user: User;

  @PrimaryColumn({ name: 'server_id' })
  serverId: string;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'server_id' })
  server: Server;

  @Column({
    default: 0,
    name: 'time',
  })
  time: number;

  @CreateDateColumn({ name: 'created' })
  created: Date;

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;
}
