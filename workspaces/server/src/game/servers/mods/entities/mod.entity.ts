import { StorageManager } from '@common';
import { AfterRemove, Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Server } from '../../entities/server.entity';

@Entity({
  name: "unicore_mods",
  orderBy: {
    name: "ASC"
  }
})
export class Mod {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "name" })
  name: string;

  @Column({ name: "link", nullable: true })
  link: string;

  @Column('text', { name: "description", nullable: true })
  description: string;

  @Column({ name: "icon", nullable: true })
  icon: string;

  @ManyToMany(() => Server, (server) => server.mods, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  servers: Server[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
