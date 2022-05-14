import { StorageManager } from "@common";
import { Server } from "src/game/servers/entities/server.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { GroupKit } from "./group-kit.entity";

@Entity({ name: "unicore_group_kit_images" })
export class GroupKitImage {
  @ManyToOne(() => GroupKit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
    orphanedRowAction: 'delete'
  })
  @JoinColumn({ name: "kit_id" })
  kit: GroupKit;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
    eager: true
  })
  @JoinColumn({ name: "server_id" })
  server: Server;

  @Column({ name: "image" })
  image: string

  removeFile() {
    StorageManager.remove(this.image);
  }
}