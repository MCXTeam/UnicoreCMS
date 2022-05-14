import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Server } from '../../entities/server.entity';

@Entity({ name: "unicore_queries" })
export class Query {
  @Column({ nullable: true, name: "host" })
  host?: string;

  @Column({ nullable: true, name: "port" })
  port?: number;

  @OneToOne(() => Server, (server) => server.query, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: "server_id" })
  server: Server;
}
