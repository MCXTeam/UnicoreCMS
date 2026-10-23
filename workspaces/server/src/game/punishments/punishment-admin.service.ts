import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, In } from 'typeorm';
import { ConnectInstance } from '../connect/entities/connect-instance.entity';
import { GamePunishmentCommand } from '../connect/entities/game-punishment.entity';
import { PunishmentCase, PunishmentBinding, PunishmentProviderState } from './entities/punishment.entity';
import { PunishmentGroup } from './entities/punishment-group.entity';
import { PunishmentAudit, PunishmentPurchase } from './entities/punishment-purchase.entity';
import { PunishmentAccess } from './punishment-access.service';
import { PunishmentCoordinator } from './punishment-coordinator.service';
import { PunishmentDeliveryService } from './punishment-delivery.service';
import { AccountRestrictionsService } from './account-restrictions.service';
import { PunishmentConversionInput, PunishmentIssueInput, PunishmentSaleInput, PunishmentTransferInput } from './dto/punishment-management.input';
import { ACTIVE_PURCHASES, effectiveStatus, identityHash, lockPunishments, punishmentAudit } from './punishment.model';

@Injectable()
export class PunishmentAdmin {
  constructor(private dataSource: DataSource, private access: PunishmentAccess, private coordinator: PunishmentCoordinator, private delivery: PunishmentDeliveryService, private accounts: AccountRestrictionsService) {}

  private async current(manager: EntityManager, id: string, revision: number) {
    const item = await manager.findOneBy(PunishmentCase, { id });
    if (!item) throw new NotFoundException();
    if (item.revision !== revision) throw new ConflictException('Наказание уже изменено, обновите страницу');
    return item;
  }

  issue(request: any, input: PunishmentIssueInput) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      return this.create(manager, request, input);
    });
  }

  private async create(manager: EntityManager, request: any, input: PunishmentIssueInput, migrationFromId: string | null = null) {
    const hash = identityHash(request.user.uuid, input, migrationFromId);
    const existing = await manager.findOneBy(PunishmentCase, { id: input.requestId });
    if (existing) {
      if (existing.requestHash !== hash) throw new ConflictException('Повторный запрос отличается от исходного');
      await this.access.assert(request, 'issue', existing, manager);
      return existing;
    }
    if (!input.reason.trim() || input.expiresAtMs != null && input.expiresAtMs <= Date.now()) throw new BadRequestException('Укажите причину и будущий срок наказания');
    if (input.scopeType !== 'PROJECT' && !input.scopeId) throw new BadRequestException('Выберите область действия');
    if (input.scopeType === 'GROUP') {
      const group = await manager.findOneBy(PunishmentGroup, { id: input.scopeId });
      if (!group || !group.kinds.includes(input.kind)) throw new BadRequestException('Группа не поддерживает этот тип наказания');
    }
    const item = manager.create(PunishmentCase, {
      id: input.requestId, requestHash: hash, migrationFromId, category: 'GAME', kind: input.kind, subjectUuid: input.subjectUuid,
      subject: { kind: 'PLAYER', value: input.subjectUuid }, scopeType: input.scopeType, scopeId: input.scopeId || null,
      reason: input.reason.trim(), actor: { uuid: request.user.uuid, name: request.user.username, console: false },
      issuedAtMs: Date.now(), expiresAtMs: input.expiresAtMs ?? null, status: 'ACTIVE', desired: 'ACTIVE', revision: 1,
    });
    if (item.scopeType === 'INSTANCE') {
      const instance = await manager.findOneBy(ConnectInstance, { id: item.scopeId, retired: false });
      if (!instance) throw new NotFoundException('Экземпляр сервера не найден');
      let providerId = input.providerId;
      if (!providerId) {
        const providers = (await manager.findBy(PunishmentProviderState, { streamId: instance.id })).filter((provider) => provider.capabilities.issueKinds.includes(item.kind));
        if (providers.length !== 1) throw new ConflictException('Выберите провайдера наказаний');
        providerId = providers[0].providerId;
      }
      await manager.save(item);
      await manager.save(PunishmentBinding, { id: identityHash(item.id, instance.id, providerId), caseId: item.id, streamId: instance.id, providerId, ownership: 'COPY', desired: 'ACTIVE', status: 'PENDING', member: true });
    }
    await this.access.assert(request, 'issue', item, manager);
    const targets = await this.delivery.targets(manager, item);
    if (!targets.length) throw new BadRequestException('В области нет игровых серверов');
    for (const target of targets) if (!(await this.delivery.canManage(manager, target, item.kind, true, false, item.expiresAtMs))) throw new ConflictException('Один из провайдеров не разрешает выдачу и снятие этого наказания с выбранным сроком');
    await manager.save(item);
    await this.delivery.reconcile(manager, item);
    await punishmentAudit(manager, 'game.issued', item.id, request.user.uuid, { scopeType: item.scopeType, scopeId: item.scopeId });
    return item;
  }

  revoke(request: any, id: string, revision: number) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      const item = await this.current(manager, id, revision);
      await this.access.assert(request, 'revoke', item, manager);
      if (!(await this.delivery.canRevoke(manager, item))) throw new ConflictException('Провайдер не разрешает снятие этого наказания с сайта');
      if (item.category === 'ACCOUNT') return this.accounts.revoke(manager, item.id, request.user.uuid);
      return this.coordinator.revoke(manager, item, request.user.uuid);
    });
  }

  sale(request: any, id: string, input: PunishmentSaleInput) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      const item = await this.current(manager, id, input.revision);
      await this.access.assert(request, 'sale', item, manager);
      if (input.blocked && !input.reason?.trim()) throw new BadRequestException('Укажите причину запрета покупки');
      item.saleBlocked = input.blocked; item.saleBlockedReason = input.blocked ? input.reason.trim() : null; item.revision++;
      await manager.save(item);
      await punishmentAudit(manager, 'sale.changed', item.id, request.user.uuid, { blocked: item.saleBlocked, reason: item.saleBlockedReason });
      return item;
    });
  }

  transfer(request: any, id: string, input: PunishmentTransferInput) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      const item = await this.current(manager, id, input.revision);
      await this.access.assert(request, 'issue', item, manager);
      if (item.category !== 'GAME' || effectiveStatus(item) !== 'ACTIVE' || item.desired !== 'ACTIVE') throw new ConflictException('Перенести можно только действующее игровое наказание');
      if (item.nativeBroad || !(await this.delivery.canRevoke(manager, item))) throw new ConflictException('Это наказание сохраняет область действия своей игровой системы');
      if (await manager.exists(PunishmentPurchase, { where: { caseId: id, status: In(ACTIVE_PURCHASES) } })) throw new ConflictException('Сначала завершите текущую покупку разбана');
      const group = await manager.findOneBy(PunishmentGroup, { id: input.groupId });
      if (!group || !group.kinds.includes(item.kind)) throw new BadRequestException('Группа не поддерживает этот тип наказания');
      const next = manager.create(PunishmentCase, { ...item, scopeType: 'GROUP', scopeId: group.id });
      await this.access.assert(request, 'issue', next, manager);
      const bindings = await manager.findBy(PunishmentBinding, { caseId: id });
      const preview = { caseId: id, revision: item.revision, groupId: group.id, groupName: group.name, add: group.members.filter((member) => !bindings.some((binding) => binding.streamId === member.streamId && binding.providerId === member.providerId)), remove: bindings.filter((binding) => !group.members.some((member) => member.streamId === binding.streamId && member.providerId === binding.providerId)).map((row) => ({ streamId: row.streamId, providerId: row.providerId })) };
      if (!input.confirm) return { preview: { ...preview, groupRevision: group.revision } };
      if (input.groupRevision !== group.revision) throw new ConflictException('Состав группы изменился, повторите предварительный просмотр');
      item.scopeType = 'GROUP'; item.scopeId = group.id; item.revision++;
      await manager.save(item);
      await this.delivery.reconcile(manager, item);
      await punishmentAudit(manager, 'game.transferred', item.id, request.user.uuid, preview);
      return { preview, item };
    });
  }

  convertAccount(request: any, id: string, revision: number, input: PunishmentConversionInput, confirm: boolean) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      await this.accounts.synchronize(manager);
      const source = await manager.findOneBy(PunishmentCase, { id, category: 'ACCOUNT' });
      if (!source) throw new NotFoundException();
      await this.access.assert(request, 'revoke', source, manager);
      const derived = { ...input, subjectUuid: source.subjectUuid, kind: 'BAN', reason: source.reason, expiresAtMs: source.expiresAtMs ?? undefined };
      const replay = await manager.findOneBy(PunishmentCase, { id: input.requestId });
      if (replay) return this.create(manager, request, derived, source.id);
      if (source.revision !== revision || effectiveStatus(source) !== 'ACTIVE') throw new ConflictException('Блокировка аккаунта уже изменена');
      const target = manager.create(PunishmentCase, { ...source, category: 'GAME', scopeType: derived.scopeType, scopeId: derived.scopeId || null });
      await this.access.assert(request, 'issue', target, manager);
      let targets = await this.delivery.targets(manager, target);
      if (target.scopeType === 'INSTANCE') {
        const providers = (await manager.findBy(PunishmentProviderState, { streamId: target.scopeId })).filter((provider) => provider.capabilities.issueKinds.includes('BAN'));
        const providerId = derived.providerId || (providers.length === 1 ? providers[0].providerId : null);
        if (!providerId) throw new ConflictException('Выберите провайдера наказаний');
        targets = [{ streamId: target.scopeId, providerId, primaryKinds: [] }];
      }
      if (!targets.length) throw new BadRequestException('В области нет игровых серверов');
      for (const member of targets) if (!(await this.delivery.canManage(manager, member, 'BAN', true, false))) throw new ConflictException('Провайдер не поддерживает перенос');
      const previewToken = identityHash(source.id, source.revision, target.scopeType, target.scopeId, targets.map(({ streamId, providerId }) => [streamId, providerId]).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
      if (!confirm) return { preview: { caseId: source.id, targetScopeType: target.scopeType, targetScopeId: target.scopeId, servers: targets, accountRemainsBlockedUntilApplied: true, previewToken } };
      if (input.previewToken !== previewToken) throw new ConflictException('Область переноса изменилась, повторите предварительный просмотр');
      const current = await manager.findOneBy(PunishmentCase, { migrationFromId: source.id, status: 'ACTIVE' });
      if (current && current.id !== input.requestId) throw new ConflictException('Перенос этой блокировки уже выполняется');
      const item = await this.create(manager, request, derived, source.id);
      await punishmentAudit(manager, 'account.conversion.requested', source.id, request.user.uuid, { targetId: item.id });
      return item;
    });
  }

  async details(request: any, id: string) {
    const manager = this.dataSource.manager;
    const item = await manager.findOneBy(PunishmentCase, { id });
    if (!item) throw new NotFoundException();
    await this.access.assert(request, 'read', item);
    const bindings = await manager.findBy(PunishmentBinding, { caseId: id });
    const audit = await manager.find(PunishmentAudit, { where: { caseId: id }, order: { createdAt: 'DESC' }, take: 100 });
    const canPurchases = await this.access.allows(request, 'purchases', item);
    const purchases = canPurchases ? await manager.find(PunishmentPurchase, { where: { caseId: id }, order: { createdAt: 'DESC' } }) : [];
    return { item, bindings, audit, purchases };
  }

  retry(request: any, id: string, bindingId: string) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      const item = await manager.findOneByOrFail(PunishmentCase, { id });
      await this.access.assert(request, item.desired === 'ACTIVE' ? 'issue' : 'revoke', item, manager);
      const binding = await manager.findOneBy(PunishmentBinding, { id: bindingId, caseId: id });
      if (!binding || !['FAILED', 'UNSUPPORTED', 'CONFLICT'].includes(binding.status)) throw new ConflictException('Повтор возможен только после подтверждённой ошибки без выполнения');
      if (binding.desired === 'ACTIVE') binding.issueCommandId = null;
      else binding.revokeCommandId = null;
      binding.status = 'PENDING';
      await manager.save(binding);
      await this.delivery.reconcile(manager, item);
      await punishmentAudit(manager, 'delivery.retry', id, request.user.uuid, { bindingId });
      return binding;
    });
  }

  verify(request: any, id: string, bindingId: string, externalId: string, reason: string) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      const item = await manager.findOneByOrFail(PunishmentCase, { id });
      await this.access.assert(request, item.desired === 'ACTIVE' ? 'issue' : 'revoke', item, manager);
      const binding = await manager.findOneBy(PunishmentBinding, { id: bindingId, caseId: id });
      if (!binding || binding.status !== 'UNKNOWN' || binding.revokeCommandId || !binding.issueCommandId || !externalId.trim() || !reason.trim()) throw new ConflictException('Выберите неопределённую выдачу и укажите проверяемую запись провайдера');
      const original = await manager.findOneByOrFail(GamePunishmentCommand, { commandId: binding.issueCommandId });
      const commandId = randomUUID();
      const payload = { ...original.payload, commandId, verifyOnly: true, correlationCommandId: original.commandId, punishment: { ...original.payload.punishment, externalId: externalId.trim() } };
      await manager.save(GamePunishmentCommand, { commandId, caseId: id, bindingId, requestHash: identityHash(payload), streamId: binding.streamId, serverId: original.serverId, providerId: binding.providerId, payload, status: 'PENDING', offeredAt: null });
      binding.issueCommandId = commandId; binding.status = 'PENDING';
      await manager.save(binding);
      await punishmentAudit(manager, 'delivery.verification.requested', id, request.user.uuid, { bindingId, externalId, reason });
      return { commandId };
    });
  }
}
