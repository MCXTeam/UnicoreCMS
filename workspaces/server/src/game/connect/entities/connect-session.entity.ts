import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

const counter = { to: (value: number) => value, from: (value: string) => Number(value) };

@Entity({ name: 'unicore_connect_sessions' })
@Index(['streamId'])
export class ConnectSession {
  @PrimaryColumn({ length: 36 })
  sessionId: string;

  @Column({ length: 64 })
  streamId: string;

  @Column({ length: 36 })
  userUuid: string;

  @Column({ type: 'bigint', default: 0, transformer: counter })
  sequence: number;

  @Column({ type: 'bigint', default: 0, transformer: counter })
  connectedMs: number;

  @Column({ type: 'bigint', default: 0, transformer: counter })
  activeMs: number;

  @Column({ default: false })
  closed: boolean;
}

@Entity({ name: 'unicore_connect_playtimes' })
@Index(['serverId', 'userUuid'], { unique: true })
@Index('idx_connect_playtimes_user_server', ['userUuid', 'serverId'])
export class ConnectPlaytime {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ length: 64 })
  serverId: string;

  @Column({ length: 36 })
  userUuid: string;

  @Column({ type: 'bigint', default: 0, transformer: counter })
  baselineMs: number;

  @Column({ type: 'bigint', default: 0, transformer: counter })
  connectedMs: number;

  @Column({ type: 'bigint', default: 0, transformer: counter })
  activeMs: number;
}
