import { RconCommandStatus } from 'unicore-common';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Server } from '../../entities/server.entity';

@Entity({ name: 'unicore_rcon_commands' })
export class RconCommand {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'server_id' })
  serverId: string;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'server_id' })
  server: Server;

  @Column({ name: 'command', type: 'text' })
  command: string;

  @Column({ name: 'label', nullable: true })
  label?: string;

  @Column({ name: 'kind', nullable: true })
  kind?: string;

  @Index()
  @Column({ name: 'status', type: 'int', default: RconCommandStatus.Pending })
  status: RconCommandStatus;

  @Column({ name: 'attempts', type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'worker', nullable: true })
  worker?: string | null;

  @Column({ name: 'error', type: 'text', nullable: true })
  error?: string | null;

  @Column({ name: 'next_attempt', type: 'datetime', nullable: true })
  nextAttempt?: Date | null;

  @Column({ name: 'sent_at', type: 'datetime', nullable: true })
  sentAt?: Date | null;

  @CreateDateColumn({ name: 'created' })
  created: Date;

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;
}
