import { Exclude } from 'class-transformer';
import { Role } from 'src/admin/roles/entities/role.entity';
import { Ban } from 'src/game/cabinet/bans/entities/ban.entity';
import { Cloak } from 'src/game/cabinet/skin/entities/cloak.entity';
import { Skin } from 'src/game/cabinet/skin/entities/skin.entity';
import { Column, CreateDateColumn, Entity, Generated, JoinTable, ManyToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { encryptedColumn, ENCRYPTED_TWO_FACTOR_SECRET, ENCRYPTED_TWO_FACTOR_SECRET_TEMP } from '@common';

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

  @Column({ name: 'superuser', nullable: true })
  superuser: boolean;

  @Column({ name: 'activated', nullable: true })
  activated: boolean;

  @Exclude()
  @Column({ name: 'access_token', nullable: true })
  accessToken: string;

  @Column({ name: 'server_id', nullable: true })
  serverId: string;

  @Column({ name: 'two_factor_enabled', nullable: true })
  two_factor_enabled?: boolean;

  @Column({ name: 'two_factor_secret', type: 'text', nullable: true, transformer: encryptedColumn(ENCRYPTED_TWO_FACTOR_SECRET) })
  two_factor_secret?: string;

  @Column({
    name: 'two_factor_secret_temp',
    type: 'text',
    nullable: true,
    transformer: encryptedColumn(ENCRYPTED_TWO_FACTOR_SECRET_TEMP),
  })
  two_factor_secret_temp?: string;

  @Column('float', { name: 'real', default: 0 })
  real: number;

  @Column('float', { name: 'virtual', default: 0 })
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
