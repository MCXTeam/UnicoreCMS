import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'unicore_punishment_purchases' })
@Index(['buyerUuid', 'requestId'], { unique: true })
@Index(['caseId', 'status'])
export class PunishmentPurchase {
  @PrimaryColumn({ length: 36 }) id: string;
  @Column({ length: 36 }) requestId: string;
  @Column({ length: 36 }) buyerUuid: string;
  @Column({ length: 64 }) caseId: string;
  @Column({ type: 'decimal', precision: 16, scale: 4, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } }) amount: number;
  @Column({ length: 16, default: 'RESERVED' }) status: string;
  @Column({ type: 'bigint', nullable: true, transformer: { to: (v: number | null) => v, from: (v: string | null) => v == null ? null : Number(v) } }) expiresAtMs: number | null;
  @Column({ type: 'simple-json' }) snapshot: { reason: string; scopeType: string; scopeId: string | null; revision: number; targetBindingIds: string[] };
  @Column({ length: 64, nullable: true }) ip: string | null;
  @Column({ type: 'text', nullable: true }) resolution: string | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity({ name: 'unicore_punishment_audit' })
@Index(['caseId', 'createdAt'])
export class PunishmentAudit {
  @PrimaryColumn({ length: 36 }) id: string;
  @Column({ length: 64, nullable: true }) caseId: string | null;
  @Column({ length: 36, nullable: true }) actorUuid: string | null;
  @Column({ length: 64 }) action: string;
  @Column({ type: 'simple-json' }) detail: Record<string, unknown>;
  @CreateDateColumn() createdAt: Date;
}
