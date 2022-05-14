import { StorageManager } from '@common';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Kit } from 'src/game/store/entities/kit.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { AfterRemove, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Mod } from '../mods/entities/mod.entity';
import { Online } from '../online/entities/online.entity';
import { Query } from '../online/entities/query.entity';
import { RCON } from '../rcon/entities/rcon.entity';
import { ServerGroup } from './server-group.entity';
import { ServerTable } from './server-table.entity';

@Entity({
  name: "unicore_servers",
  orderBy: {
    priority: "ASC"
  }
})
export class Server {
  @PrimaryColumn({ name: "id" })
  id: string;

  @Column({ name: "priority", nullable: true })
  priority?: number;

  @Column({ name: "name" })
  name: string;

  @Column({ name: "version", nullable: true })
  version: string;

  @Column('text', { name: "slogan", nullable: true })
  slogan: string;

  @Column('longtext', { name: "description", nullable: true })
  description: string;

  @Column('text', { name: "content", nullable: true })
  content: string;

  @Column({ name: "icon", nullable: true })
  icon: string;

  @Column({ name: "image", nullable: true })
  image: string;

  @ManyToOne(() => ServerGroup, (room) => room.servers, { eager: true })
  group: ServerGroup[];

  @OneToOne(() => Online, (online) => online.server, {
    cascade: ['insert', 'update'],
  })
  online: Online;

  @OneToOne(() => Query, (query) => query.server, {
    cascade: ['insert', 'update'],
  })
  query: Query;

  @OneToOne(() => RCON, (rcon) => rcon.server, {
    cascade: ['insert', 'update'],
  })
  rcon: RCON;

  @ManyToMany(() => Mod, (mod) => mod.servers)
  @JoinTable({
    name: "unicore_servers_mods",
    joinColumn: {
      name: "server_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "mod_id",
      referencedColumnName: "id"
    }
  })
  mods?: Mod[];

  @ManyToMany(() => Product, (product) => product.servers)
  @JoinTable({
    name: "unicore_servers_products",
    joinColumn: {
      name: "server_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "product_id",
      referencedColumnName: "id"
    }
  })
  products?: Product[];

  @ManyToMany(() => DonateGroup, (group) => group.servers)
  @JoinTable({
    name: "unicore_servers_donate_groups",
    joinColumn: {
      name: "server_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "donate_group_id",
      referencedColumnName: "id"
    }
  })
  donate_groups?: DonateGroup[];

  @ManyToMany(() => DonatePermission, (perm) => perm.servers)
  @JoinTable({
    name: "unicore_servers_donate_permissions",
    joinColumn: {
      name: "server_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "donate_permission_id",
      referencedColumnName: "id"
    }
  })
  donate_permissions?: DonatePermission[];

  @ManyToMany(() => Kit, (kit) => kit.servers)
  @JoinTable({
    name: "unicore_servers_kits",
    joinColumn: {
      name: "server_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "kit_id",
      referencedColumnName: "id"
    }
  })
  kits?: Kit[];

  @OneToMany(() => ServerTable, (table) => table.server, {
    cascade: ['insert', 'update'],
  })
  table: ServerTable[]

  @CreateDateColumn({ name: "created" })
  created: Date;

  @UpdateDateColumn({ name: "updated" })
  updated: Date;

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
    StorageManager.remove(this.image);
  }
}
