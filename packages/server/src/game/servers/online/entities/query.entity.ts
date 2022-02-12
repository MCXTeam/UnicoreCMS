import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Server } from '../../entities/server.entity';

@Entity()
export class Query {
  @Column({ nullable: true })
  host?: string;

  @Column({ nullable: true })
  port?: number;

  @OneToOne(() => Server, (server) => server.query, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn()
  server: Server;
}
