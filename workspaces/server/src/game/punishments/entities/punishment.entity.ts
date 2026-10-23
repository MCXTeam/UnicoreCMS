import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'unicore_punishment_cases' })
@Index(['subjectUuid', 'status', 'issuedAtMs'])
@Index(['scopeType', 'scopeId', 'status'])
export class PunishmentCase {
  @PrimaryColumn({ length: 64 }) id: string;
  @Column({ length: 64, nullable: true }) requestHash: string | null;
  @Column({ length: 64, nullable: true }) migrationFromId: string | null;
  @Column({ length: 16 }) category: string;
  @Column({ length: 16 }) kind: string;
  @Column({ length: 36, nullable: true }) subjectUuid: string | null;
  @Column({ type: 'simple-json' }) subject: { kind: string; value: string };
  @Column({ length: 16 }) scopeType: string;
  @Column({ length: 64, nullable: true }) scopeId: string | null;
  @Column({ type: 'text' }) reason: string;
  @Column({ type: 'simple-json', nullable: true }) actor: { uuid?: string; name?: string; console?: boolean } | null;
  @Column({ type: 'bigint', transformer: { to: (v: number) => v, from: (v: string) => Number(v) } }) issuedAtMs: number;
  @Column({ type: 'bigint', nullable: true, transformer: { to: (v: number | null) => v, from: (v: string | null) => v == null ? null : Number(v) } }) expiresAtMs: number | null;
  @Column({ length: 16, default: 'ACTIVE' }) status: string;
  @Column({ length: 16, default: 'ACTIVE' }) desired: string;
  @Column({ default: false }) saleBlocked: boolean;
  @Column({ type: 'text', nullable: true }) saleBlockedReason: string | null;
  @Column({ length: 64, nullable: true }) originStreamId: string | null;
  @Column({ length: 128, nullable: true }) nativeScope: string | null;
  @Column({ length: 64, nullable: true }) nativeProviderId: string | null;
  @Column({ default: false }) nativeBroad: boolean;
  @Column({ default: 1 }) revision: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity({ name: 'unicore_punishment_bindings' })
@Index(['caseId', 'streamId', 'providerId'], { unique: true })
@Index(['observedId'])
export class PunishmentBinding {
  @PrimaryColumn({ length: 64 }) id: string;
  @Column({ length: 64 }) caseId: string;
  @Column({ length: 64 }) streamId: string;
  @Column({ length: 64 }) providerId: string;
  @Column({ length: 64, nullable: true }) observedId: string | null;
  @Column({ length: 256, nullable: true }) externalId: string | null;
  @Column({ length: 16, default: 'COPY' }) ownership: string;
  @Column({ length: 16, default: 'ACTIVE' }) desired: string;
  @Column({ length: 32, default: 'PENDING' }) status: string;
  @Column({ default: true }) member: boolean;
  @Column({ length: 36, nullable: true }) issueCommandId: string | null;
  @Column({ length: 36, nullable: true }) revokeCommandId: string | null;
  @Column({ type: 'text', nullable: true }) detail: string | null;
  @Column({ type: 'bigint', nullable: true, transformer: { to: (v: number | null) => v, from: (v: string | null) => v == null ? null : Number(v) } }) settledAtMs: number | null;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity({ name: 'unicore_punishment_providers' })
@Index(['streamId', 'providerId'], { unique: true })
export class PunishmentProviderState {
  @PrimaryColumn({ length: 64 }) id: string;
  @Column({ length: 64 }) streamId: string;
  @Column({ length: 64 }) providerId: string;
  @Column({ length: 16 }) mode: string;
  @Column({ type: 'simple-json' }) capabilities: { kinds: string[]; issueKinds: string[]; revokeKinds: string[]; subjects: string[]; exactRevoke: boolean; timedKinds?: string[]; permanentKinds?: string[] };
  @Column({ length: 128, default: '' }) version: string;
  @UpdateDateColumn() seenAt: Date;
}
