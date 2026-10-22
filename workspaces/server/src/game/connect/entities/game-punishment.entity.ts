import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'unicore_game_punishments' })
@Index(['serverId', 'subjectUuid'])
@Index(['subjectUuid', 'status', 'issuedAtMs'])
@Index(['streamId', 'providerId', 'id'])
export class GamePunishment {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ length: 64 })
  serverId: string;

  @Column({ length: 64 })
  streamId: string;

  @Column({ length: 64 })
  providerId: string;

  @Column({ length: 36, nullable: true })
  subjectUuid: string | null;

  @Column({ length: 16 })
  status: string;

  @Column({ type: 'bigint', transformer: { to: (value: number) => value, from: (value: string) => Number(value) } })
  issuedAtMs: number;

  @Column({ type: 'simple-json' })
  payload: Record<string, any>;

  @Column({ default: 1 })
  revision: number;
}

@Entity({ name: 'unicore_game_punishment_events' })
export class GamePunishmentEvent {
  @PrimaryColumn({ length: 36 })
  eventId: string;

  @Column({ length: 64 })
  streamId: string;

  @Column({ length: 64 })
  punishmentId: string;

  @Column({ type: 'simple-json' })
  payload: Record<string, any>;

  @CreateDateColumn()
  receivedAt: Date;
}

@Entity({ name: 'unicore_game_punishment_commands' })
@Index(['streamId', 'providerId', 'status', 'createdAt'])
export class GamePunishmentCommand {
  @PrimaryColumn({ length: 36 })
  commandId: string;

  @Column({ length: 64 })
  requestHash: string;

  @Column({ length: 64, nullable: true })
  streamId: string | null;

  @Column({ length: 64 })
  serverId: string;

  @Column({ length: 64 })
  providerId: string;

  @Column({ length: 32, default: 'PENDING' })
  status: string;

  @Column({ type: 'simple-json' })
  payload: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  result: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
