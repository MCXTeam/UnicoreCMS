import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DonatePermission } from './donate-permission.entity';

@Entity()
export class UsersDonatePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @ManyToOne(() => DonatePermission, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true
  })
  @JoinColumn()
  permission: DonatePermission;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true
  })
  @JoinColumn()
  server: Server;

  @Column({
    nullable: true,
  })
  gived: boolean

  @Column({
    nullable: true,
  })
  expired: Date;

  @CreateDateColumn()
  created: Date;
}
