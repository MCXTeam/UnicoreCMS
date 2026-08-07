import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Server } from './server.entity';

@Entity({
  name: 'unicore_server_instances',
  orderBy: {
    priority: 'ASC',
  },
})
export class ServerInstance {
  @PrimaryColumn({ name: 'priority' })
  priority: number;

  @PrimaryColumn({ name: 'server_id' })
  serverId: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ nullable: true, name: 'host' })
  host?: string;

  @Column({ nullable: true, name: 'port' })
  port?: number;

  @Column({ nullable: true, name: 'online' })
  online?: boolean;

  @Column({ nullable: true, name: 'players' })
  players?: number;

  @Column({ nullable: true, name: 'maxplayers' })
  maxplayers?: number;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    orphanedRowAction: 'delete',
    nullable: false,
  })
  @JoinColumn({ name: 'server_id' })
  server: Server;

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;
}
