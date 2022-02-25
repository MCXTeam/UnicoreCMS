import { StorageManager } from '@common';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Kit } from 'src/game/store/entities/kit.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { AfterRemove, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ServerTableDto } from '../dto/server-table.dto';
import { Mod } from '../mods/entities/mod.entity';
import { Online } from '../online/entities/online.entity';
import { Query } from '../online/entities/query.entity';

@Entity()
export class Server {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  version: string;

  @Column('text', { nullable: true })
  slogan: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  image: string;

  @OneToOne(() => Online, (online) => online.server, {
    cascade: ['insert', 'update'],
  })
  online: Online;

  @OneToOne(() => Query, (query) => query.server, {
    cascade: ['insert', 'update'],
  })
  query: Query;

  @ManyToMany(() => Mod, (mod) => mod.servers)
  @JoinTable()
  mods?: Mod[];

  @ManyToMany(() => Product, (product) => product.servers)
  @JoinTable()
  products?: Product[];

  @ManyToMany(() => DonateGroup, (group) => group.servers)
  @JoinTable()
  donate_groups?: DonateGroup[];

  @ManyToMany(() => DonatePermission, (perm) => perm.servers)
  @JoinTable()
  donate_permissions?: DonatePermission[];

  @ManyToMany(() => Kit, (kit) => kit.servers)
  @JoinTable()
  kits?: Kit[];

  @Column('json', { nullable: true })
  table: ServerTableDto[]

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
    StorageManager.remove(this.image);
  }
}
