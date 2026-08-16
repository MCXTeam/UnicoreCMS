import { decimalColumn, MONEY_PRECISION, MONEY_SCALE } from '@common';
import { Server } from 'src/game/servers/entities/server.entity';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
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

  @Column({ name: 'priority', nullable: true })
  priority?: number;

  @Column({ name: 'type' })
  type: PermissionType;

  @Column('decimal', { name: 'price', precision: MONEY_PRECISION, scale: MONEY_SCALE, transformer: decimalColumn })
  price: number;

  @Column({ nullable: true, name: 'virtual_percent' })
  virtual_percent?: number;

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
}
