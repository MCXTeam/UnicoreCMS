import { StorageManager } from '@common';
import { Server } from 'src/game/servers/entities/server.entity';
import { AfterRemove, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Period } from '../../entities/period.entity';
import { DonateFeaturesDto } from '../dto/donate-features.dto';
import { GroupKit } from './group-kit.entity';

@Entity()
export class DonateGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  ingame_id: string;

  @Column('float')
  price: number;

  @Column({ nullable: true })
  sale: number;

  @Column({
    nullable: true,
  })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column('json', { nullable: true })
  features?: DonateFeaturesDto[];

  @ManyToMany(() => GroupKit, (kit) => kit.groups)
  @JoinTable()
  kits: GroupKit[];

  @ManyToMany(() => Period, (period) => period.donate_groups)
  @JoinTable()
  periods: Period[];

  @Column('simple-array', {
    nullable: true
  })
  web_perms: string[];

  @ManyToMany(() => Server, (server) => server.donate_groups)
  servers: Server[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
