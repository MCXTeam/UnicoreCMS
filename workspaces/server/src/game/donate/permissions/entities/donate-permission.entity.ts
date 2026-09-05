import { decimalColumn, MONEY_PRECISION, MONEY_SCALE } from '@common';
import { Role } from 'src/admin/roles/entities/role.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Column, Entity, JoinColumn, JoinTable, ManyToOne, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Period } from '../../entities/period.entity';
import { GroupKit } from '../../groups/entities/group-kit.entity';
import { PermissionType } from '../enums/permission-type.enum';
import { Translatable } from 'src/admin/locales/translatable.decorator';

@Translatable('donate_permission', ['name', 'description'])
@Entity({
  name: 'unicore_donate_permissions',
  orderBy: {
    priority: 'ASC',
    id: 'ASC',
  },
})
export class DonatePermission {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'hidden', default: false })
  hidden: boolean;

  @Column({ name: 'giftable', default: true })
  giftable: boolean;

  @Column({ name: 'regiftable', default: true })
  regiftable: boolean;

  @Column({ name: 'priority', nullable: true })
  priority?: number;

  @Column({ name: 'type' })
  type: PermissionType;

  @Column('decimal', { name: 'price', precision: MONEY_PRECISION, scale: MONEY_SCALE, transformer: decimalColumn })
  price: number;

  @Column({ nullable: true, name: 'virtual_percent' })
  virtual_percent?: number;

  @Column({ nullable: true, name: 'referal_percent' })
  referal_percent?: number;

  @Column({ nullable: true, name: 'sale' })
  sale: number;

  @Column('longtext', {
    name: 'description',
    nullable: true,
  })
  description: string;

  @Column('simple-array', {
    name: 'perms',
    nullable: true,
  })
  perms: string[];

  @Column('simple-array', {
    name: 'web_perms',
    nullable: true,
  })
  web_perms: string[];

  @ManyToMany(() => GroupKit, (kit) => kit.permission, {
    eager: true,
  })
  @JoinTable({
    name: 'unicore_donate_permissions_kits',
    joinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'kit_id',
      referencedColumnName: 'id',
    },
  })
  kits: GroupKit[];

  @ManyToMany(() => Server, (server) => server.donate_permissions)
  servers: Server[];

  @ManyToMany(() => Period, (period) => period.donate_permissions)
  @JoinTable({
    name: 'unicore_donate_permissions_periods',
    joinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'period_id',
      referencedColumnName: 'id',
    },
  })
  periods: Period[];

  @ManyToOne(() => Role, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'web_role_id' })
  web_role?: Role;
}
