import { StorageManager } from '@common';
import { Server } from 'src/game/servers/entities/server.entity';
import { AfterRemove, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DonateFeatures } from '../interfaces/donate-features.interface';
import { Period } from '../../entities/period.entity';
import { GroupKit } from './group-kit.entity';

@Entity()
export class DonateGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal', {
    precision: 5,
    scale: 2,
  })
  price: number;

  @Column({
    nullable: true,
  })
  description: string;

  @Column()
  icon: string;

  @Column('json', { nullable: true })
  features?: DonateFeatures[];

  @ManyToMany(() => GroupKit, (kit) => kit.groups)
  @JoinTable()
  kits: GroupKit[];

  @ManyToMany(() => Period, (period) => period.donate_groups)
  @JoinTable()
  periods: Period[];

  @Column('simple-array', { default: '' })
  web_perms: string[];

  @Column()
  ingame_id: string;

  @ManyToMany(() => Server)
  servers: Server[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
