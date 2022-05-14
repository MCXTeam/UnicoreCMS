import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Server } from '../../entities/server.entity';

@Entity({ name: "unicore_onlines" })
export class Online {
  @Column({ name: "online", nullable: true })
  online: boolean;

  @Column({ name: "players", nullable: true })
  players: number;

  @Column({ name: "maxplayers", nullable: true })
  maxplayers: number;

  @Column({ name: "record", default: 0 })
  record: number;

  @Column({ name: "record_today", default: 0 })
  record_today: number;

  @OneToOne(() => Server, (server) => server.online, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: "server_id" })
  server: Server;

  @UpdateDateColumn({ name: "updated" })
  updated: Date;
}
