import { Role } from 'src/admin/roles/entities/role.entity';
import { Ban } from 'src/game/cabinet/bans/entities/ban.entity';
import { Referal } from 'src/game/cabinet/referals/entities/referal.entity';
import { Cloak } from 'src/game/cabinet/skin/entities/cloak.entity';
import { Skin } from 'src/game/cabinet/skin/entities/skin.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  @Generated('uuid')
  uuid: string;

  @Column({
    unique: true,
  })
  username: string;

  @Column({
    unique: true,
    nullable: true,
  })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  superuser: boolean;

  @Column({ nullable: true })
  activated: boolean;

  @Column({ nullable: true })
  accessToken: string;

  @Column({ nullable: true })
  serverId: string;

  @Column({ nullable: true })
  two_factor_enabled?: boolean;

  @Column({ nullable: true })
  two_factor_secret?: string;

  @Column({ nullable: true })
  two_factor_secret_temp?: string;

  @Column({ default: 0 })
  real: number;

  @ManyToMany(() => Role, (role) => role.users, {
    eager: true,
  })
  @JoinTable()
  roles?: Role[];

  @Column('simple-array', { nullable: true })
  perms: string[];

  // @OneToMany(() => Payment, payment => payment.user)
  // payments: Payment[]

  @OneToOne(() => Skin, (skin) => skin.user, {
    eager: true,
  })
  skin?: Skin;

  @OneToOne(() => Cloak, (cloak) => cloak.user, {
    eager: true,
  })
  cloak?: Cloak;

  @OneToOne(() => Ban, (ban) => ban.user, {
    eager: true,
  })
  ban?: Ban;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
