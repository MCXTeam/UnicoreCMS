import { StorageManager } from '@common';
import { AfterRemove, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Server } from './server.entity';

@Entity({ name: "unicore_server_groups" })
export class ServerGroup {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "name" })
  name: string;

  @Column('text', {
    name: "description",
    nullable: true,
  })
  description: string;

  @Column({ name: "icon", nullable: true })
  icon: string;

  @OneToMany(() => Server, (server) => server.group, {
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
