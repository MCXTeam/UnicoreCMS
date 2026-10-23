import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EntityManager, In } from 'typeorm';
import { ConnectInstance } from '../connect/entities/connect-instance.entity';
import { GamePunishment, GamePunishmentCommand } from '../connect/entities/game-punishment.entity';
import { PunishmentGroup, PunishmentMember } from './entities/punishment-group.entity';
import { PunishmentBinding, PunishmentCase, PunishmentProviderState } from './entities/punishment.entity';
import { effectiveStatus, identityHash, isExpired, SUCCESS_RESULTS } from './punishment.model';
import { supportsOperation } from './punishment-capabilities';

@Injectable()
export class PunishmentDeliveryService {
  async targets(manager: EntityManager, item: PunishmentCase): Promise<PunishmentMember[]> {
    if (item.scopeType === 'GROUP') return (await manager.findOneBy(PunishmentGroup, { id: item.scopeId }))?.members || [];
    if (item.scopeType === 'INSTANCE' || item.scopeType === 'NATIVE') {
      const bindings = await manager.findBy(PunishmentBinding, { caseId: item.id, streamId: item.scopeId });
      return bindings.map(({ streamId, providerId }) => ({ streamId, providerId, primaryKinds: [] }));
    }
    const instances = await manager.find(ConnectInstance, { where: { retired: false, ...(item.scopeType === 'SERVER' ? { serverId: item.scopeId } : item.scopeType === 'INSTANCE' || item.scopeType === 'NATIVE' ? { id: item.scopeId } : {}) } });
    const providers = await manager.find(PunishmentProviderState, { where: { streamId: In(instances.map((row) => row.id)) } });
    return instances.flatMap((instance) => {
      const available = providers.filter((row) => row.streamId === instance.id && row.capabilities.kinds.includes(item.kind));
      return [{ streamId: instance.id, providerId: available.length === 1 ? available[0].providerId : 'unconfigured', primaryKinds: [] }];
    });
  }

  async canManage(manager: EntityManager, binding: Pick<PunishmentBinding, 'streamId' | 'providerId'>, kind: string, issue = false, requireFresh = true, expiresAtMs: number | null = null) {
    const provider = await manager.findOneBy(PunishmentProviderState, { id: identityHash(binding.streamId, binding.providerId) });
    const instance = await manager.findOneBy(ConnectInstance, { id: binding.streamId });
    return Boolean(instance && !instance.retired && supportsOperation(provider, kind, issue, expiresAtMs) &&
      (!requireFresh || Date.now() - provider.seenAt.getTime() < 60_000));
  }

  async canRevoke(manager: EntityManager, item: PunishmentCase) {
    if (item.category === 'ACCOUNT') return true;
    const bindings = (await manager.findBy(PunishmentBinding, { caseId: item.id })).filter((binding) => binding.member || binding.status !== 'ABSENT');
    if (!bindings.length) return false;
    for (const binding of bindings) {
      if (!(await this.canManage(manager, binding, item.kind, false, false))) return false;
      if (binding.observedId && (await manager.findOneBy(GamePunishment, { id: binding.observedId }))?.payload.manageable === false) return false;
    }
    return true;
  }

  async reconcile(manager: EntityManager, item: PunishmentCase) {
    if (item.category !== 'GAME') return;
    if (isExpired(item)) { item.status = 'EXPIRED'; item.desired = 'REVOKED'; }
    const targets = await this.targets(manager, item);
    const bindings = await manager.findBy(PunishmentBinding, { caseId: item.id });
    if (item.desired === 'ACTIVE') {
      for (const target of targets) {
        if (bindings.some((row) => row.streamId === target.streamId && row.providerId === target.providerId)) continue;
        const binding = await manager.save(PunishmentBinding, { id: identityHash(item.id, target.streamId, target.providerId), caseId: item.id, streamId: target.streamId, providerId: target.providerId, ownership: 'COPY', desired: 'ACTIVE', status: 'PENDING', member: true });
        bindings.push(binding);
      }
    }
    for (const binding of bindings) {
      const wasMember = binding.member;
      binding.member = targets.some((target) => target.streamId === binding.streamId && target.providerId === binding.providerId);
      if (!wasMember && binding.member && binding.status === 'ABSENT') { binding.issueCommandId = null; binding.revokeCommandId = null; }
      binding.desired = item.desired === 'ACTIVE' && binding.member ? 'ACTIVE' : 'REVOKED';
      await this.reconcileBinding(manager, item, binding);
    }
    if (item.desired === 'REVOKED' && bindings.every((row) => row.status === 'ABSENT')) item.status = item.status === 'EXPIRED' || isExpired(item) ? 'EXPIRED' : 'REVOKED';
    await manager.save(PunishmentCase, item);
  }

  private async reconcileBinding(manager: EntityManager, item: PunishmentCase, binding: PunishmentBinding) {
    let observed = binding.observedId ? await manager.findOneBy(GamePunishment, { id: binding.observedId }) : null;
    if (binding.desired === 'ACTIVE' && observed?.status === 'ACTIVE' && binding.revokeCommandId) {
      const cleanup = await manager.findOneBy(GamePunishmentCommand, { commandId: binding.revokeCommandId });
      if (cleanup?.payload.cleanup && ['PENDING','UNKNOWN'].includes(cleanup.status)) {
        if (!(await this.cancelUnoffered(manager, cleanup))) {
          binding.status = cleanup.status; binding.detail = 'Ожидается завершение снятия прежней копии';
          await manager.save(PunishmentBinding, binding);
          return;
        }
      }
      binding.revokeCommandId = null;
    }
    if (observed && effectiveStatus({ status: observed.status, expiresAtMs: observed.payload.expiresAtMs ?? null }) !== 'ACTIVE') {
      binding.status = 'ABSENT';
      if (binding.desired === 'REVOKED') { binding.settledAtMs ??= Date.now(); await manager.save(PunishmentBinding, binding); return; }
      if (item.status === 'ACTIVE') {
        binding.observedId = null; binding.externalId = null; binding.issueCommandId = null; binding.revokeCommandId = null;
        observed = null;
      }
    }
    if (binding.desired === 'ACTIVE' && observed?.status === 'ACTIVE') {
      binding.status = 'APPLIED'; binding.detail = null;
    } else if (binding.desired === 'REVOKED' && !observed) {
      const issue = binding.issueCommandId ? await manager.findOneBy(GamePunishmentCommand, { commandId: binding.issueCommandId }) : null;
      if (issue) await this.cancelUnoffered(manager, issue);
      if (!issue || ['FAILED', 'UNSUPPORTED', 'CANCELLED'].includes(issue.status)) binding.status = 'ABSENT';
      else if (issue.status === 'UNKNOWN') { binding.status = 'UNKNOWN'; binding.detail = 'Ожидается сверка результата выдачи'; }
      else binding.status = 'PENDING';
    } else {
      const revoke = binding.desired === 'REVOKED';
      const commandId = revoke ? binding.revokeCommandId : binding.issueCommandId;
      const command = commandId ? await manager.findOneBy(GamePunishmentCommand, { commandId }) : null;
      if (command) {
        if (command.status === 'UNKNOWN') { binding.status = 'UNKNOWN'; binding.detail = command.result?.message || 'Результат требует сверки'; }
        else if (command.status === 'PENDING') binding.status = 'PENDING';
        else if (SUCCESS_RESULTS.includes(command.status)) {
          if (revoke) { binding.status = 'WAIT_OBSERVATION'; binding.detail = 'Ожидается подтверждение отсутствия записи у провайдера'; }
          else { binding.status = observed ? 'APPLIED' : 'WAIT_OBSERVATION'; binding.detail = observed ? null : 'Ожидается подтверждённая запись провайдера'; }
        } else if (command.payload.verifyOnly && command.payload.correlationCommandId) {
          binding.issueCommandId = command.payload.correlationCommandId; binding.status = 'UNKNOWN'; binding.detail = command.result?.message || 'Запись не подтверждена, исходная выдача требует сверки';
        } else { binding.status = command.status; binding.detail = command.result?.message || 'Провайдер не выполнил операцию'; }
      } else if (revoke && observed?.payload.manageable === false || !(await this.canManage(manager, binding, item.kind, !revoke, false, item.expiresAtMs))) {
        binding.status = 'UNSUPPORTED'; binding.detail = 'Управление этим наказанием недоступно';
      } else {
        const independent = !revoke && (await manager.find(GamePunishment, { where: { streamId: binding.streamId, providerId: binding.providerId, subjectUuid: item.subjectUuid, status: 'ACTIVE' } }))
          .some((row) => row.payload.kind === item.kind && row.caseId !== item.id && !isExpired({ expiresAtMs: row.payload.expiresAtMs ?? null }));
        if (independent) {
          binding.status = 'CONFLICT'; binding.detail = 'На сервере действует независимое наказание';
        } else await this.enqueue(manager, item, binding, revoke, observed);
      }
    }
    if (binding.status === 'ABSENT') binding.settledAtMs ??= Date.now();
    else binding.settledAtMs = null;
    await manager.save(PunishmentBinding, binding);
  }

  private async cancelUnoffered(manager: EntityManager, command: GamePunishmentCommand) {
    if (command.status !== 'PENDING' || command.offeredAt != null) return false;
    command.status = 'CANCELLED';
    await manager.save(GamePunishmentCommand, command);
    return true;
  }

  private async enqueue(manager: EntityManager, item: PunishmentCase, binding: PunishmentBinding, revoke: boolean, observed: GamePunishment | null) {
    const instance = await manager.findOneByOrFail(ConnectInstance, { id: binding.streamId });
    const commandId = randomUUID();
    const punishment = revoke ? { ...observed.payload, revision: observed.revision } : {
      id: item.id, providerId: binding.providerId, externalId: `cms:${item.id}`, subject: item.subject, kind: item.kind,
      scope: { serverId: instance.serverId, instanceId: instance.instanceId }, reason: item.reason, actor: item.actor,
      issuedAtMs: item.issuedAtMs, expiresAtMs: item.expiresAtMs, status: 'ACTIVE', revision: item.revision,
    };
    const payload = { commandId, punishment, revoke, cleanup: revoke && item.desired === 'ACTIVE', expectedRevision: revoke ? observed.revision : undefined };
    await manager.save(GamePunishmentCommand, { commandId, caseId: item.id, bindingId: binding.id, requestHash: identityHash(payload), streamId: binding.streamId, serverId: instance.serverId, providerId: binding.providerId, status: 'PENDING', offeredAt: null, payload });
    if (revoke) binding.revokeCommandId = commandId;
    else binding.issueCommandId = commandId;
    binding.status = 'PENDING'; binding.detail = null;
  }

  async acknowledge(manager: EntityManager, command: GamePunishmentCommand) {
    if (!command.bindingId) return;
    const binding = await manager.findOneBy(PunishmentBinding, { id: command.bindingId });
    const item = await manager.findOneBy(PunishmentCase, { id: command.caseId });
    if (!binding || !item) return;
    if ((command.payload.revoke ? binding.revokeCommandId : binding.issueCommandId) !== command.commandId) return;
    if (SUCCESS_RESULTS.includes(command.status) && !command.payload.revoke && command.result?.externalId) binding.externalId = command.result.externalId;
    await manager.save(PunishmentBinding, binding);
    await this.reconcile(manager, item);
  }
}
