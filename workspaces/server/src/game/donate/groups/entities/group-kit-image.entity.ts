import { StorageManager } from '@common';
import { Server } from 'src/game/servers/entities/server.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { GroupKit } from './group-kit.entity';

@Entity({ name: 'unicore_group_kit_images' })
export class GroupKitImage {
  @PrimaryColumn({ name: 'kit_id' })
  kitId: number;

  @ManyToOne(() => GroupKit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'kit_id' })
  kit: GroupKit;

  @PrimaryColumn({ name: 'server_id' })
  serverId: string;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'server_id' })
  server: Server;

  @Column({ name: 'image' })
  image: string;

  removeFile() {
    StorageManager.remove(this.image);
  }
}
