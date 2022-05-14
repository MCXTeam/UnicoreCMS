import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DonateGroup } from './donate-group.entity';

@Entity({ name: "unicore_users_donate_groups" })
export class UsersDonateGroup {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: "user_uuid" })
  user: User;

  @ManyToOne(() => DonateGroup, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: "group_id" })
  group: DonateGroup;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: "server_id" })
  server: Server;

  @Column({
    name: "expired",
    nullable: true,
  })
  expired: Date;

  @CreateDateColumn({ name: "created" })
  created: Date;
}
