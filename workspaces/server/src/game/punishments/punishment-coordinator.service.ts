import { ConflictException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { GamePunishment, GamePunishmentCommand } from '../connect/entities/game-punishment.entity';
import { PunishmentBinding, PunishmentCase } from './entities/punishment.entity';
import { PunishmentGroup } from './entities/punishment-group.entity';
import { PunishmentDeliveryService } from './punishment-delivery.service';
import { identityHash, punishmentAudit } from './punishment.model';

@Injectable()
export class PunishmentCoordinator {
  constructor(private delivery: PunishmentDeliveryService) {}

  async observe(manager: EntityManager, row: GamePunishment, origin = 'SNAPSHOT', commandId?: string) {
    let cleanup = false;
    let binding = await manager.findOneBy(PunishmentBinding, { observedId: row.id });
    if (!binding && row.caseId) {
      const current = await manager.findOneBy(PunishmentBinding, { caseId: row.caseId, streamId: row.streamId, providerId: row.providerId });
      if (current && current.externalId !== row.payload.externalId && commandId !== current.issueCommandId)
        return manager.findOneByOrFail(PunishmentCase, { id: row.caseId });
    }
    if (commandId) {
      const command = await manager.findOneBy(GamePunishmentCommand, { commandId });
      const target = command?.payload?.punishment;
      if (!command || command.streamId !== row.streamId || command.providerId !== row.providerId || target.kind !== row.payload.kind || target.subject.kind !== row.payload.subject.kind || target.subject.value !== row.payload.subject.value)
        throw new ConflictException('Punishment command correlation mismatch');
      cleanup = Boolean(command.payload.revoke && command.payload.cleanup);
      if (command.bindingId) {
        const linked = await manager.findOneByOrFail(PunishmentBinding, { id: command.bindingId });
        if (command.commandId !== linked.issueCommandId && command.commandId !== linked.revokeCommandId) {
          row.caseId = linked.caseId;
          await manager.save(GamePunishment, row);
          return manager.findOneByOrFail(PunishmentCase, { id: linked.caseId });
        }
        if (binding && binding.id !== linked.id || linked.externalId && linked.externalId !== row.payload.externalId) throw new ConflictException('Native punishment identity mismatch');
        binding = linked;
      }
    }
    if (!binding) binding = await manager.findOneBy(PunishmentBinding, { streamId: row.streamId, providerId: row.providerId, externalId: row.payload.externalId });
    let item = binding ? await manager.findOneByOrFail(PunishmentCase, { id: binding.caseId }) : null;
    if (!item) {
      const groups = ['LIVE', 'POLL'].includes(origin) && !commandId && row.status === 'ACTIVE' && row.payload.subject.kind === 'PLAYER' && row.payload.manageable !== false && row.payload.groupable !== false
        ? (await manager.findBy(PunishmentGroup, { enabled: true })).filter((group) => group.kinds.includes(row.payload.kind) && group.members.some((member) => member.streamId === row.streamId && member.providerId === row.providerId && member.primaryKinds.includes(row.payload.kind))) : [];
      if (groups.length > 1) throw new ConflictException('Several primary punishment groups');
      item = await manager.save(PunishmentCase, {
        id: identityHash('observed', row.id), category: 'GAME', kind: row.payload.kind, subjectUuid: row.subjectUuid, subject: row.payload.subject,
        scopeType: groups.length ? 'GROUP' : 'NATIVE', scopeId: groups[0]?.id || row.streamId, reason: row.payload.reason,
        actor: row.payload.actor || null, issuedAtMs: row.issuedAtMs, expiresAtMs: row.payload.expiresAtMs ?? null,
        status: row.status, desired: row.status === 'ACTIVE' ? 'ACTIVE' : 'REVOKED', originStreamId: row.streamId, revision: 1,
        nativeScope: row.payload.scope.networkId || null, nativeProviderId: row.providerId, nativeBroad: Boolean(row.payload.scope.networkId && (row.payload.groupable === false || row.payload.manageable === false || row.payload.scope.networkId === '*')),
      });
      binding = await manager.save(PunishmentBinding, {
        id: identityHash(item.id, row.streamId, row.providerId), caseId: item.id, streamId: row.streamId, providerId: row.providerId,
        observedId: row.id, externalId: row.payload.externalId, ownership: 'SOURCE', member: true,
        desired: item.desired, status: row.status === 'ACTIVE' ? 'APPLIED' : 'ABSENT',
      });
      await punishmentAudit(manager, 'observed', item.id, null, { origin, streamId: row.streamId });
    }
    binding.observedId = row.id; binding.externalId = row.payload.externalId;
    row.caseId = item.id;
    await manager.save(GamePunishment, row);
    if (row.status !== 'ACTIVE') {
      binding.status = 'ABSENT';
      binding.settledAtMs ??= Date.now();
      if (binding.member && item.desired === 'ACTIVE' && !cleanup) {
        if (row.status === 'EXPIRED') item.status = 'EXPIRED';
        item.desired = 'REVOKED'; item.revision++;
        await punishmentAudit(manager, 'provider.revoked', item.id, null, { bindingId: binding.id, status: row.status });
      }
    } else { binding.status = 'APPLIED'; binding.detail = null; binding.settledAtMs = null; }
    await manager.save(PunishmentBinding, binding);
    await this.delivery.reconcile(manager, item);
    return item;
  }

  async revoke(manager: EntityManager, item: PunishmentCase, actorUuid: string | null, reason = 'moderator.revoked') {
    if (item.desired !== 'REVOKED') {
      item.desired = 'REVOKED'; item.revision++;
      await manager.save(PunishmentCase, item);
      await punishmentAudit(manager, reason, item.id, actorUuid);
    }
    await this.delivery.reconcile(manager, item);
    return item;
  }
}
