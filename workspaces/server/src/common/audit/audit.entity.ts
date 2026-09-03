import { AuditActorType, AuditChanges, AuditClass, AuditStatus } from 'unicore-common';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import {
  AUDIT_ACTION_MAX_LENGTH,
  AUDIT_CLASS_MAX_LENGTH,
  AUDIT_CLIENT_MAX_LENGTH,
  AUDIT_IDENTIFIER_MAX_LENGTH,
  AUDIT_IP_MAX_LENGTH,
  AUDIT_NAME_MAX_LENGTH,
  AUDIT_STATUS_MAX_LENGTH,
  AUDIT_TARGET_TYPE_MAX_LENGTH,
} from '../constants';

@Entity({ name: 'unicore_audit_logs' })
@Index(['class', 'created'])
@Index(['action', 'created'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'action', length: AUDIT_ACTION_MAX_LENGTH })
  action: string;

  @Column({ name: 'class', length: AUDIT_CLASS_MAX_LENGTH })
  class: AuditClass;

  @Column({ name: 'status', length: AUDIT_STATUS_MAX_LENGTH })
  status: AuditStatus;

  @Column({ name: 'actor_type', length: AUDIT_CLASS_MAX_LENGTH })
  actorType: AuditActorType;

  @Index()
  @Column({ name: 'actor_id', length: AUDIT_IDENTIFIER_MAX_LENGTH, nullable: true })
  actorId?: string | null;

  @Column({ name: 'actor_name', length: AUDIT_NAME_MAX_LENGTH, nullable: true })
  actorName?: string | null;

  @Column({ name: 'target_type', length: AUDIT_TARGET_TYPE_MAX_LENGTH, nullable: true })
  targetType?: string | null;

  @Index()
  @Column({ name: 'target_id', length: AUDIT_IDENTIFIER_MAX_LENGTH, nullable: true })
  targetId?: string | null;

  @Column({ name: 'target_name', length: AUDIT_NAME_MAX_LENGTH, nullable: true })
  targetName?: string | null;

  @Column({ name: 'ip', length: AUDIT_IP_MAX_LENGTH, nullable: true })
  ip?: string | null;

  @Column({ name: 'client', length: AUDIT_CLIENT_MAX_LENGTH, nullable: true })
  client?: string | null;

  @Column({ name: 'changes', type: 'simple-json', nullable: true })
  changes?: AuditChanges | null;

  @Column({ name: 'meta', type: 'simple-json', nullable: true })
  meta?: Record<string, unknown> | null;

  @Index()
  @CreateDateColumn({ name: 'created' })
  created: Date;
}
