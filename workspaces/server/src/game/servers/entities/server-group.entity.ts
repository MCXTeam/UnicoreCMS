import { StorageManager } from '@common';
import { AfterRemove, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Server } from './server.entity';

@Entity()
export class ServerGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', {
    nullable: true,
  })
  description: string;

  @Column({ nullable: true })
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
