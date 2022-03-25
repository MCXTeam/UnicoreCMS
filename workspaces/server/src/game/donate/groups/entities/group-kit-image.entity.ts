import { StorageManager } from "@common";
import { Server } from "src/game/servers/entities/server.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { GroupKit } from "./group-kit.entity";

@Entity()
export class GroupKitImage {
  @ManyToOne(() => GroupKit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
    orphanedRowAction: 'delete'
  })
  @JoinColumn()
  kit: GroupKit;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
    eager: true
  })
  @JoinColumn()
  server: Server;

  @Column()
  image: string

  removeFile() {
    StorageManager.remove(this.image);
  }
}