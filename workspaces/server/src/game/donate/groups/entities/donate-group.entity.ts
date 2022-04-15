import { StorageManager } from '@common';
import { Server } from 'src/game/servers/entities/server.entity';
import { AfterRemove, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Period } from '../../entities/period.entity';
import { GroupFeature } from './group-feature.entity';
import { GroupKit } from './group-kit.entity';

@Entity({
  orderBy: {
    priority: "ASC"
  }
})
export class DonateGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  priority?: number;

  @Column()
  ingame_id: string;

  @Column('float')
  price: number;

  @Column({ nullable: true })
  prevent_use_virtual: boolean

  @Column({ nullable: true })
  sale: number;

  @Column('longtext', {
    nullable: true,
  })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @OneToMany(() => GroupFeature, (feature) => feature.group, {
    cascade: ['insert', 'update'],
    eager: true
  })
  @JoinTable()
  features: GroupFeature[]

  @ManyToMany(() => GroupKit, (kit) => kit.groups)
  @JoinTable()
  kits: GroupKit[];

  @ManyToMany(() => Period, (period) => period.donate_groups)
  @JoinTable()
  periods: Period[];

  @Column('simple-array', {
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
