import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Server } from '../../entities/server.entity';

@Entity()
export class Online {
  @Column({ nullable: true })
  online: boolean;

  @Column({ nullable: true })
  players: number;

  @Column({ nullable: true })
  maxplayers: number;

  @Column({ default: 0 })
  record: number;

  @Column({ default: 0 })
  record_today: number;

  @OneToOne(() => Server, (server) => server.online, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn()
  server: Server;

  @UpdateDateColumn()
  updated: Date
}
