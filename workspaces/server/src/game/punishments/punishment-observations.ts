import { BadRequestException, ConflictException } from '@nestjs/common';
import { isDeepStrictEqual } from 'node:util';
import { EntityManager } from 'typeorm';
import { GamePunishment, GamePunishmentEvent } from '../connect/entities/game-punishment.entity';
import { ConnectInstance } from '../connect/entities/connect-instance.entity';
import { identityHash } from './punishment.model';

export async function saveObservation(manager: EntityManager, instance: ConnectInstance, payload: Record<string, any>, eventId?: string) {
  if (payload.scope?.serverId !== instance.serverId) throw new BadRequestException('Punishment scope mismatch');
  const id = identityHash(instance.id, payload.providerId, payload.kind, payload.externalId);
  if (eventId) {
    const received = await manager.findOneBy(GamePunishmentEvent, { eventId });
    if (received) {
      if (received.streamId !== instance.id || received.punishmentId !== id) throw new ConflictException('Event identity mismatch');
      return { row: await manager.findOneBy(GamePunishment, { id }), changed: false };
    }
    await manager.save(GamePunishmentEvent, { eventId, streamId: instance.id, punishmentId: id, payload });
  }
  const existing = await manager.findOneBy(GamePunishment, { id });
  if (existing && (existing.payload.subject.kind !== payload.subject.kind || existing.payload.subject.value !== payload.subject.value || existing.issuedAtMs !== payload.issuedAtMs))
    throw new ConflictException('Native punishment identity changed');
  if (existing && existing.status !== 'ACTIVE') return { row: existing, changed: false };
  const normalized = { ...payload, id, scope: { ...payload.scope, instanceId: instance.instanceId }, revision: 0 };
  if (existing && isDeepStrictEqual({ ...existing.payload, revision: 0 }, normalized)) return { row: existing, changed: false };
  const row = await manager.save(GamePunishment, {
    ...existing, id, streamId: instance.id, serverId: instance.serverId, providerId: payload.providerId,
    status: payload.status, issuedAtMs: payload.issuedAtMs, subjectUuid: payload.subject.kind === 'PLAYER' ? payload.subject.value : null,
    payload: normalized, revision: (existing?.revision || 0) + 1,
  });
  return { row, changed: true };
}
