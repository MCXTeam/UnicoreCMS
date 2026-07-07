import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Server } from '../../entities/server.entity';

@Entity({ name: 'unicore_queries' })
export class Query {
  @Column({ nullable: true, name: 'host' })
  host?: string;

  @Column({ nullable: true, name: 'port' })
  port?: number;

  @PrimaryColumn({ name: 'server_id' })
  serverId: string;

  @OneToOne(() => Server, (server) => server.query, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'server_id' })
  server: Server;
}
