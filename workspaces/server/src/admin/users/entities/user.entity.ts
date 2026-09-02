import { Exclude } from 'class-transformer';
import { Role } from 'src/admin/roles/entities/role.entity';
import { Ban } from 'src/game/cabinet/bans/entities/ban.entity';
import { Cloak } from 'src/game/cabinet/skin/entities/cloak.entity';
import { Skin } from 'src/game/cabinet/skin/entities/skin.entity';
import { Column, CreateDateColumn, Entity, Generated, JoinTable, ManyToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { MONEY_PRECISION, MONEY_SCALE, bigintColumn, decimalColumn } from '@common';

@Entity({ name: 'unicore_users' })
export class User {
  @PrimaryColumn({ name: 'uuid' })
  @Generated('uuid')
  uuid: string;

  @Column({
    name: 'username',
    unique: true,
  })
  username: string;

  @Column({
    name: 'email',
    unique: true,
    nullable: true,
  })
  email: string;

  @Exclude()
  @Column({ name: 'password' })
  password: string;

  @Column({ name: 'locale', nullable: true, length: 5 })
  locale: string;

  @Column({ name: 'superuser', nullable: true })
  superuser: boolean;

  @Column({ name: 'activated', nullable: true })
  activated: boolean;

  @Exclude()
  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken: string;

  @Column({ name: 'server_id', nullable: true })
  serverId: string;

  @Column({ name: 'password_change_required', nullable: true })
  password_change_required?: boolean;

  @Column({ name: 'two_factor_enabled', nullable: true })
  two_factor_enabled?: boolean;

  @Column({ name: 'two_factor_secret', type: 'text', nullable: true })
  two_factor_secret?: string;

  @Column({ name: 'two_factor_secret_temp', type: 'text', nullable: true })
  two_factor_secret_temp?: string;

  @Column({ name: 'two_factor_counter', type: 'bigint', nullable: true, transformer: bigintColumn })
  two_factor_counter?: number;

  @Column('decimal', { name: 'real', precision: MONEY_PRECISION, scale: MONEY_SCALE, default: 0, transformer: decimalColumn })
  real: number;

  @Column('decimal', { name: 'virtual', precision: MONEY_PRECISION, scale: MONEY_SCALE, default: 0, transformer: decimalColumn })
  virtual: number;

  @ManyToMany(() => Role, (role) => role.users, {
    eager: true,
  })
  @JoinTable({
    name: 'unicore_users_roles',
    joinColumn: {
      name: 'user_uuid',
      referencedColumnName: 'uuid',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles?: Role[];

  @Column('simple-array', { name: 'perms', nullable: true })
  perms: string[];

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

  @CreateDateColumn({ name: 'created' })
  created: Date;

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;
}
