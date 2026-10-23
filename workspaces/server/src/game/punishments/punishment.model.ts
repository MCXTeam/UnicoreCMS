import { createHash, randomUUID } from 'node:crypto';
import { EntityManager } from 'typeorm';
import { PunishmentCase } from './entities/punishment.entity';
import { PunishmentSettings } from './entities/punishment-group.entity';
import { PunishmentAudit } from './entities/punishment-purchase.entity';

export const ACTIVE_PURCHASES = ['RESERVED', 'REVIEW'];
export const SUCCESS_RESULTS = ['APPLIED', 'ALREADY_APPLIED'];
export const SHARED_KINDS = ['BAN', 'MUTE'];
export const ALL_KINDS = ['BAN', 'MUTE', 'WARN', 'KICK', 'JAIL'];
export const identityHash = (...parts: unknown[]) => createHash('sha256').update(JSON.stringify(parts)).digest('hex');
export const isExpired = (item: { expiresAtMs: number | null }, now = Date.now()) => item.expiresAtMs != null && item.expiresAtMs <= now;
export const effectiveStatus = (item: Pick<PunishmentCase, 'status' | 'expiresAtMs'>, now = Date.now()) => item.status === 'ACTIVE' && isExpired(item, now) ? 'EXPIRED' : item.status;

export async function lockPunishments(manager: EntityManager): Promise<PunishmentSettings> {
  await manager.createQueryBuilder().insert().into(PunishmentSettings).values({ id: 'global', gameUnbanEnabled: false, gameUnbanPrice: 150, servers: {} }).orUpdate(['id'], ['id']).execute();
  return manager.findOneOrFail(PunishmentSettings, { where: { id: 'global' }, lock: { mode: 'pessimistic_write' } });
}

export function punishmentAudit(manager: EntityManager, action: string, caseId: string | null, actorUuid: string | null, detail: Record<string, unknown> = {}) {
  return manager.save(PunishmentAudit, { id: randomUUID(), caseId, actorUuid, action, detail });
}
