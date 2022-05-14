import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DonatePermission } from './donate-permission.entity';

@Entity({ name: "unicore_users_donate_permissions" })
export class UsersDonatePermission {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: "user_uuid" })
  user: User;

  @ManyToOne(() => DonatePermission, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: "permission_id" })
  permission: DonatePermission;

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
