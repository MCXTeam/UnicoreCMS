import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { PresenceSnapshot } from '../connect.protocol';

@Entity({ name: 'unicore_connect_instances' })
@Index(['serverId'])
export class ConnectInstance {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ length: 64 })
  serverId: string;

  @Column({ length: 36 })
  instanceId: string;

  @Column({ length: 64 })
  tokenId: string;

  @Column({ length: 36, default: '' })
  bootId: string;

  @Column({ default: 0 })
  epoch: number;

  @Column({ type: 'datetime' })
  registeredAt: Date;

  @Column({ default: false })
  retired: boolean;

  @Column({ type: 'bigint', default: 0, transformer: { to: (value: number) => value, from: (value: string) => Number(value) } })
  sequence: number;

  @Column({ type: 'datetime', nullable: true })
  lastSeenAt: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  snapshot: PresenceSnapshot | null;
}
