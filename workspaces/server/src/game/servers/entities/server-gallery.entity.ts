import { StorageManager } from '@common';
import { AfterRemove, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Server } from './server.entity';

@Entity({
  name: 'unicore_server_gallery',
  orderBy: {
    priority: 'ASC',
  },
})
export class ServerGalleryImage {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'priority', default: 0 })
  priority: number;

  @Column({ name: 'file' })
  file: string;

  @Column({ name: 'title', nullable: true })
  title?: string;

  @ManyToOne(() => Server, (server) => server.gallery, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'server_id' })
  server: Server;

  @Column({ name: 'server_id' })
  serverId: string;

  @CreateDateColumn({ name: 'created' })
  created: Date;

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.file);
  }
}
