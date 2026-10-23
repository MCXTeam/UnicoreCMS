import { Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Brackets, DataSource, EntityManager, In, SelectQueryBuilder } from 'typeorm';
import { Permission, PunishmentPage, PunishmentView } from 'unicore-common';
import { UserProtectedDto } from 'src/admin/users/dto/user-protected.dto';
import { User } from 'src/admin/users/entities/user.entity';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { userPermissionCheck } from 'src/admin/roles/grant';
import { Server } from '../servers/entities/server.entity';
import { ConnectInstance } from '../connect/entities/connect-instance.entity';
import { PunishmentCase, PunishmentBinding } from './entities/punishment.entity';
import { PunishmentGroup } from './entities/punishment-group.entity';
import { PunishmentPurchase } from './entities/punishment-purchase.entity';
import { PunishmentAccess } from './punishment-access.service';
import { PunishmentPolicy } from './punishment-policy.service';
import { ACTIVE_PURCHASES, effectiveStatus } from './punishment.model';

export interface PunishmentListQuery { tab?: string; category?: string; scopeType?: string; scopeId?: string; subjectUuid?: string; search?: string; page?: number | string; limit?: number | string; kind?: string }

@Injectable()
export class PunishmentViews {
  constructor(private dataSource: DataSource, private access: PunishmentAccess, private policy: PunishmentPolicy) {}

  async list(query: PunishmentListQuery, request?: any, admin = false): Promise<PunishmentPage> {
    const manager = this.dataSource.manager;
    const qb = manager.getRepository(PunishmentCase).createQueryBuilder('punishment').where('punishment.subjectUuid IS NOT NULL');
    if (query.kind !== 'ALL') qb.andWhere('punishment.kind = :kind', { kind: query.kind || 'BAN' });
    if (query.subjectUuid) qb.andWhere('punishment.subjectUuid = :subjectUuid', { subjectUuid: query.subjectUuid });
    if (['GAME', 'ACCOUNT'].includes(query.category)) qb.andWhere('punishment.category = :category', { category: query.category });
    if (query.scopeType === 'INSTANCE') qb.andWhere("punishment.scopeType IN ('INSTANCE','NATIVE') AND punishment.nativeBroad = FALSE");
    else if (query.scopeType === 'PROJECT') qb.andWhere("(punishment.scopeType = 'PROJECT' OR (punishment.scopeType = 'NATIVE' AND punishment.nativeBroad = TRUE))");
    else if (query.scopeType) qb.andWhere('punishment.scopeType = :scopeType', { scopeType: query.scopeType });
    if (query.scopeId) qb.andWhere('punishment.scopeId = :scopeId', { scopeId: query.scopeId });
    if (query.search?.trim()) {
      qb.leftJoin(User, 'subject', 'subject.uuid = punishment.subjectUuid');
      qb.andWhere(new Brackets((search) => search.where('subject.username LIKE :search').orWhere('punishment.reason LIKE :search').orWhere('punishment.subjectUuid = :exact')), { search: `%${query.search.trim().slice(0,128)}%`, exact: query.search.trim() });
    }
    if (admin) await this.restrict(qb, request);
    const active = "punishment.status = 'ACTIVE' AND (punishment.expiresAtMs IS NULL OR punishment.expiresAtMs > :now)";
    const [activeCount, historyCount] = await Promise.all([qb.clone().andWhere(active, { now: Date.now() }).getCount(), qb.clone().andWhere(`NOT (${active})`, { now: Date.now() }).getCount()]);
    qb.andWhere(query.tab === 'history' ? `NOT (${active})` : active, { now: Date.now() });
    const page = Math.max(1, Math.floor(Number(query.page) || 1));
    const limit = Math.max(1, Math.min(100, Math.floor(Number(query.limit) || 25)));
    const [rows, count] = await qb.orderBy('punishment.issuedAtMs', 'DESC').addOrderBy('punishment.id', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data: await this.present(manager, rows, request, admin), counters: { active: activeCount, history: historyCount }, meta: { currentPage: page, itemsPerPage: limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  private async restrict(qb: SelectQueryBuilder<any>, request: any, action: 'read' | 'purchases' = 'read') {
    if (request?.user?.superuser) return;
    const base = `panel.punishments.${action}`;
    const global = await matchPermission([base as Permission], request);
    const [groups, instances] = await Promise.all([this.dataSource.getRepository(PunishmentGroup).find(), this.dataSource.getRepository(ConnectInstance).find()]);
    const groupIds: string[] = [], streamIds: string[] = [], serverIds: string[] = [];
    for (const group of groups) if (await matchPermission([`${base}.group:${group.id}` as Permission], request)) groupIds.push(group.id);
    for (const instance of instances) {
      const server = await matchPermission([`${base}.server:${instance.serverId}` as Permission], request);
      if (server) serverIds.push(instance.serverId);
      if (server || await matchPermission([`${base}.instance:${instance.id}` as Permission], request)) streamIds.push(instance.id);
    }
    const project = await matchPermission([`${base}.project` as Permission], request);
    const account = await matchPermission([action === 'read' ? 'panel.users.read' : `${base}.account` as Permission], request);
    qb.andWhere(new Brackets((scope) => {
      scope.where('1 = 0');
      if (global) scope.orWhere("punishment.category = 'GAME'");
      if (account) scope.orWhere("punishment.category = 'ACCOUNT'");
      if (groupIds.length) scope.orWhere("punishment.scopeType = 'GROUP' AND punishment.scopeId IN (:...groupIds)", { groupIds });
      if (streamIds.length) scope.orWhere("punishment.scopeType IN ('INSTANCE', 'NATIVE') AND punishment.nativeBroad = FALSE AND punishment.scopeId IN (:...streamIds)", { streamIds });
      if (serverIds.length) scope.orWhere("punishment.scopeType = 'SERVER' AND punishment.scopeId IN (:...serverIds)", { serverIds });
      if (project) scope.orWhere("(punishment.scopeType = 'PROJECT' OR (punishment.scopeType = 'NATIVE' AND punishment.nativeBroad = TRUE))");
    }));
  }

  async purchaseList(query: PunishmentListQuery, request: any) {
    const manager = this.dataSource.manager;
    const qb = manager.getRepository(PunishmentPurchase).createQueryBuilder('purchase')
      .innerJoin(PunishmentCase, 'punishment', 'punishment.id = purchase.caseId');
    await this.restrict(qb, request, 'purchases');
    qb.andWhere(`purchase.status ${query.tab === 'history' ? 'NOT IN' : 'IN'} (:...statuses)`, { statuses: ACTIVE_PURCHASES });
    const page = Math.max(1, Math.floor(Number(query.page) || 1));
    const limit = Math.max(1, Math.min(100, Math.floor(Number(query.limit) || 25)));
    const [rows, count] = await qb.orderBy('purchase.status', 'DESC')
      .addOrderBy('purchase.createdAt', 'DESC').addOrderBy('purchase.id', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    const users = rows.length ? await manager.find(User, { where: { uuid: In([...new Set(rows.map((purchase) => purchase.buyerUuid))]) }, select: ['uuid', 'username'] }) : [];
    return { data: rows.map((purchase) => ({ ...purchase, buyerName: users.find((user) => user.uuid === purchase.buyerUuid)?.username || null })), meta: { currentPage: page, itemsPerPage: limit, totalItems: count, totalPages: Math.ceil(count / limit) } };
  }

  async present(manager: EntityManager, items: PunishmentCase[], request?: any, admin = false): Promise<PunishmentView[]> {
    if (!items.length) return [];
    const uuids = [...new Set(items.flatMap((item) => [item.subjectUuid, item.actor?.uuid]).filter(Boolean))];
    const [users, groups, servers, instances, bindings, purchases] = await Promise.all([
      manager.find(User, { where: { uuid: In(uuids) }, relations: ['skin', 'cloak', 'roles'] }), manager.find(PunishmentGroup), manager.find(Server), manager.find(ConnectInstance),
      manager.findBy(PunishmentBinding, { caseId: In(items.map((item) => item.id)) }),
      request?.user ? manager.find(PunishmentPurchase, { where: { buyerUuid: request.user.uuid, caseId: In(items.map((item) => item.id)) }, order: { createdAt: 'DESC' } }) : [],
    ]);
    const byUser = new Map(users.map((user) => [user.uuid, user]));
    const byServer = new Map(servers.map((server) => [server.id, server.name]));
    const byInstance = new Map(instances.map((instance) => [instance.id, instance]));
    const result: PunishmentView[] = [];
    for (const item of items) {
      const links = bindings.filter((binding) => binding.caseId === item.id);
      const memberLinks = links.filter((binding) => binding.member || binding.status !== 'ABSENT');
      const group = groups.find((group) => group.id === item.scopeId);
      const instance = byInstance.get(item.scopeId);
      const user = byUser.get(item.subjectUuid);
      const actor = item.actor?.console ? null : byUser.get(item.actor?.uuid);
      const own = request?.user?.uuid === item.subjectUuid;
      const hierarchy = admin && user ? await userPermissionCheck(user, request.user) : true;
      const view: PunishmentView = {
        id: item.id, category: item.category as 'GAME' | 'ACCOUNT', kind: item.kind, subjectUuid: item.subjectUuid,
        user: user ? instanceToPlain(new UserProtectedDto(user)) as any : null,
        actor: actor ? { uuid: actor.uuid, username: actor.username } : null, actorName: item.actor?.console ? null : item.actor?.name || null,
        scope: { type: item.scopeType, id: item.scopeId, name: item.scopeType === 'GROUP' ? group?.name || item.scopeId : instance ? instance.displayName || `${byServer.get(instance.serverId) || instance.serverId} · ${instance.instanceId.slice(0,8)}` : item.scopeType === 'SERVER' ? byServer.get(item.scopeId) || item.scopeId : '', servers: [...new Set(memberLinks.map((binding) => byInstance.get(binding.streamId)?.serverId).filter(Boolean))] },
        reason: item.reason, created: new Date(item.issuedAtMs).toISOString(), expires: item.expiresAtMs == null ? null : new Date(item.expiresAtMs).toISOString(),
        status: effectiveStatus(item), desired: item.desired, revision: item.revision,
        delivery: { total: memberLinks.length, applied: memberLinks.filter((binding) => binding.status === 'APPLIED').length, pending: memberLinks.filter((binding) => ['PENDING', 'WAIT_OBSERVATION'].includes(binding.status)).length, attention: memberLinks.filter((binding) => ['FAILED', 'UNKNOWN', 'UNSUPPORTED', 'CONFLICT'].includes(binding.status)).length },
      };
      if (own) {
        const canBuy = await matchPermission(['player.unban.buy'], request);
        view.quote = canBuy ? await this.policy.quote(manager, item) : { available: false, price: null, reason: 'Покупка разбана недоступна для вашего аккаунта' };
        view.purchase = purchases.find((purchase) => purchase.caseId === item.id) as any || null;
      }
      if (item.scopeType === 'NATIVE' && item.nativeScope) { view.scope.nativeNetworkId = item.nativeScope; view.scope.providerId = item.nativeProviderId; }
      if (admin) {
        const manageable = await this.policy.canRevoke(manager, item);
        view.allowedActions = { revoke: hierarchy && manageable && await this.access.allows(request, 'revoke', item, manager), sale: hierarchy && await this.access.allows(request, 'sale', item, manager), transfer: hierarchy && manageable && !item.nativeBroad && item.category === 'GAME' && await this.access.allows(request, 'issue', item, manager), purchases: await this.access.allows(request, 'purchases', item, manager) };
        view.saleBlocked = item.saleBlocked; view.saleBlockedReason = item.saleBlockedReason;
      }
      result.push(view);
    }
    return result;
  }

  async mine(request: any, query: PunishmentListQuery) {
    const page = await this.list({ ...query, subjectUuid: request.user.uuid, kind: 'ALL' }, request);
    const purchases = await this.dataSource.getRepository(PunishmentPurchase).find({ where: { buyerUuid: request.user.uuid }, order: { createdAt: 'DESC' }, take: 50 });
    const totals = await this.dataSource.getRepository(PunishmentPurchase).createQueryBuilder('purchase').select('COALESCE(SUM(purchase.amount), 0)', 'amount').where('purchase.buyerUuid = :uuid AND purchase.status IN (:...statuses)', { uuid: request.user.uuid, statuses: ACTIVE_PURCHASES }).getRawOne();
    const account = await this.dataSource.getRepository(PunishmentCase).findOne({ where: { subjectUuid: request.user.uuid, category: 'ACCOUNT' }, order: { issuedAtMs: 'DESC', id: 'DESC' } });
    return { ...page, purchases, reservedBalance: Number(totals.amount), accountVersion: account ? `${account.id}:${account.revision}:${effectiveStatus(account)}` : '' };
  }
}
