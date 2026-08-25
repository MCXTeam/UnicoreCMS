import { MONEY_PRECISION, MONEY_SCALE, StorageManager, decimalColumn } from '@common';
import { ROLE_COLOR_MAX_LENGTH } from 'unicore-common';
import { Server } from 'src/game/servers/entities/server.entity';
import { AfterRemove, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Period } from '../../entities/period.entity';
import { GroupFeature } from './group-feature.entity';
import { GroupKit } from './group-kit.entity';
import { Translatable } from 'src/admin/locales/translatable.decorator';

@Translatable('donate_group', ['name', 'description', 'features.*.title', 'features.*.description'])
@Entity({
  name: 'unicore_donate_groups',
  orderBy: {
    priority: 'ASC',
  },
})
export class DonateGroup {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'giftable', default: true })
  giftable: boolean;

  @Column({ name: 'staff', default: false })
  staff: boolean;

  @Column({ name: 'color', length: ROLE_COLOR_MAX_LENGTH, nullable: true })
  color: string;

  @Column({ name: 'priority', nullable: true })
  priority?: number;

  @Column({ name: 'ingame_id' })
  ingame_id: string;

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

  @Column({ name: 'icon', nullable: true })
  icon: string;

  @OneToMany(() => GroupFeature, (feature) => feature.group, {
    cascade: ['insert', 'update'],
    eager: true,
  })
  features: GroupFeature[];

  @ManyToMany(() => GroupKit, (kit) => kit.groups)
  @JoinTable({
    name: 'unicore_donate_groups_kits',
    joinColumn: {
      name: 'group_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'kit_id',
      referencedColumnName: 'id',
    },
  })
  kits: GroupKit[];

  @ManyToMany(() => Period, (period) => period.donate_groups)
  @JoinTable({
    name: 'unicore_donate_groups_periods',
    joinColumn: {
      name: 'group_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'period_id',
      referencedColumnName: 'id',
    },
  })
  periods: Period[];

  @Column('simple-array', {
    name: 'web_perms',
    nullable: true,
  })
  web_perms: string[];

  @ManyToMany(() => Server, (server) => server.donate_groups)
  servers: Server[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
