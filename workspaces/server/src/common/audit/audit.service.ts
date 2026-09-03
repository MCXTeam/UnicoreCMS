import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditActorType, AuditChanges, AuditClass, AuditStatus, auditActionClass } from 'unicore-common';
import {
  AUDIT_CLIENT_MAX_LENGTH,
  AUDIT_IDENTIFIER_MAX_LENGTH,
  AUDIT_IP_MAX_LENGTH,
  AUDIT_META_MAX_LENGTH,
  AUDIT_NAME_MAX_LENGTH,
  AUDIT_TARGET_TYPE_MAX_LENGTH,
} from '../constants';
import { clientName, launcherClient } from '../utils/client';
import { clientIp } from '../utils/ip';
import { runAfterCommit } from '../utils/transaction';
import { AuditLog } from './audit.entity';

export const AUDIT_FALLBACK_CLASS: AuditClass = 'admin';

export interface AuditActor {
  type: AuditActorType;
  id?: string | null;
  name?: string | null;
}

export interface AuditTarget {
  type: string;
  id?: string | null;
  name?: string | null;
}

export interface AuditEntry {
  action: string;
  status?: AuditStatus;
  actor?: AuditActor | null;
  target?: AuditTarget | null;
  ip?: string | null;
  client?: string | null;
  changes?: AuditChanges | null;
  meta?: Record<string, unknown> | null;
  immediate?: boolean;
}

export interface AuditRequestContext {
  actor: AuditActor;
  ip: string | null;
  client: string | null;
}

export interface AuditLoginOptions {
  login: string;
  user?: { uuid?: string; username?: string } | null;
  ip?: string | null;
  agent?: string | null;
  launcher?: string;
  status?: AuditStatus;
  reason?: string;
  totp?: boolean;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  context(request: unknown): AuditRequestContext {
    const req = (request ?? {}) as Record<string, any>;

    return {
      actor: this.actor(req),
      ip: clientIp(req) || null,
      client: clientName(req.headers?.['user-agent']),
    };
  }

  private actor(req: Record<string, any>): AuditActor {
    const token = req.apiToken as { hint?: string; comment?: string } | undefined;

    if (token) return { type: 'integration', id: token.hint, name: token.comment ?? token.hint };

    const user = req.user as { uuid?: string; username?: string } | undefined;

    if (user?.uuid) return { type: 'user', id: user.uuid, name: user.username };

    return { type: 'system' };
  }

  login(options: AuditLoginOptions): void {
    const status = options.status ?? 'success';

    this.record({
      action: options.launcher ? 'auth.login.launcher' : 'auth.login',
      status,
      actor: { type: 'user', id: options.user?.uuid, name: options.user?.username ?? options.login },
      ip: options.ip,
      client: options.launcher ? launcherClient(options.launcher) : clientName(options.agent),
      meta: { totp: options.totp, reason: options.reason, launcher: options.launcher },
      immediate: status === 'failure',
    });
  }

  record(entry: AuditEntry): void {
    const write = () => this.write(entry);

    if (entry.immediate) {
      write();

      return;
    }

    runAfterCommit(write);
  }

  private write(entry: AuditEntry): void {
    const log = this.build(entry);

    this.auditRepository.insert(log).catch((error) => this.logger.warn(`Не удалось записать событие аудита ${entry.action}: ${error}`));
  }

  private build(entry: AuditEntry): Partial<AuditLog> {
    const known = auditActionClass(entry.action);

    if (!known) this.logger.warn(`Действие аудита ${entry.action} не объявлено в каталоге`);

    return {
      action: entry.action,
      class: known ?? AUDIT_FALLBACK_CLASS,
      status: entry.status ?? 'success',
      actorType: entry.actor?.type ?? 'system',
      actorId: this.cut(entry.actor?.id, AUDIT_IDENTIFIER_MAX_LENGTH),
      actorName: this.cut(entry.actor?.name, AUDIT_NAME_MAX_LENGTH),
      targetType: this.cut(entry.target?.type, AUDIT_TARGET_TYPE_MAX_LENGTH),
      targetId: this.cut(entry.target?.id, AUDIT_IDENTIFIER_MAX_LENGTH),
      targetName: this.cut(entry.target?.name, AUDIT_NAME_MAX_LENGTH),
      ip: this.cut(entry.ip, AUDIT_IP_MAX_LENGTH),
      client: this.cut(entry.client, AUDIT_CLIENT_MAX_LENGTH),
      changes: entry.changes && Object.keys(entry.changes).length ? entry.changes : null,
      meta: this.meta(entry.meta),
    };
  }

  private meta(source?: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!source) return null;

    const entries = Object.entries(source).filter(([, value]) => value !== undefined && value !== null);

    if (!entries.length) return null;

    const meta = Object.fromEntries(entries);

    if (JSON.stringify(meta).length <= AUDIT_META_MAX_LENGTH) return meta;

    return { truncated: true };
  }

  private cut(value: unknown, length: number): string | null {
    if (value === undefined || value === null) return null;

    const text = String(value).trim();

    return text ? text.slice(0, length) : null;
  }
}
