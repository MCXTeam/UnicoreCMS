import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, LessThanOrEqual } from 'typeorm';
import { Ban } from '../cabinet/bans/entities/ban.entity';
import { PunishmentCase } from './entities/punishment.entity';
import { isExpired, lockPunishments, punishmentAudit } from './punishment.model';

@Injectable()
export class AccountRestrictionsService {
  constructor(private dataSource: DataSource) {}

  async synchronize(manager: EntityManager, userUuid?: string) {
    const bans = await manager.find(Ban, { where: userUuid ? { userUuid } : {}, relations: ['actor'] });
    const ids = new Set<string>();
    for (const ban of bans) {
      let item = ban.punishmentId ? await manager.findOneBy(PunishmentCase, { id: ban.punishmentId }) : null;
      const expiresAtMs = ban.expires?.getTime() ?? null;
      if (!item || item.reason !== ban.reason || item.expiresAtMs !== expiresAtMs || (item.actor?.uuid || null) !== (ban.actor?.uuid || null) || item.status !== 'ACTIVE' && !isExpired({ expiresAtMs })) {
        if (item?.status === 'ACTIVE') { item.status = isExpired(item) ? 'EXPIRED' : 'REVOKED'; item.desired = 'REVOKED'; item.revision++; await manager.save(item); }
        item = await this.createCase(manager, ban, ban.created?.getTime() || Date.now());
        ban.punishmentId = item.id;
        await manager.save(Ban, ban);
      }
      ids.add(item.id);
      if (isExpired(item) && item.status === 'ACTIVE') {
        item.status = 'EXPIRED'; item.desired = 'REVOKED'; item.revision++;
        await manager.save(item);
        await punishmentAudit(manager, 'account.expired', item.id, null);
      }
    }
    const active = await manager.findBy(PunishmentCase, { category: 'ACCOUNT', status: 'ACTIVE', ...(userUuid ? { subjectUuid: userUuid } : {}) });
    for (const item of active) if (!ids.has(item.id)) {
      item.status = isExpired(item) ? 'EXPIRED' : 'REVOKED'; item.desired = 'REVOKED'; item.revision++;
      await manager.save(item);
    }
  }

  private createCase(manager: EntityManager, ban: Ban, issuedAtMs: number) {
    return manager.save(PunishmentCase, {
      id: randomUUID(), category: 'ACCOUNT', kind: 'BAN', subjectUuid: ban.userUuid || ban.user?.uuid,
      subject: { kind: 'PLAYER', value: ban.userUuid || ban.user?.uuid }, scopeType: 'ACCOUNT', scopeId: null,
      reason: ban.reason, actor: ban.actor ? { uuid: ban.actor.uuid, name: ban.actor.username, console: ban.actor.username === 'Kernel' } : null,
      issuedAtMs, expiresAtMs: ban.expires?.getTime() ?? null, status: ban.expires && ban.expires.getTime() <= Date.now() ? 'EXPIRED' : 'ACTIVE',
      desired: ban.expires && ban.expires.getTime() <= Date.now() ? 'REVOKED' : 'ACTIVE', revision: 1,
    });
  }

  save(ban: Ban) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      const uuid = ban.userUuid || ban.user.uuid;
      await this.synchronize(manager, uuid);
      const previous = await manager.findOneBy(Ban, { userUuid: uuid });
      if (previous?.punishmentId) {
        const old = await manager.findOneByOrFail(PunishmentCase, { id: previous.punishmentId });
        old.status = isExpired(old) ? 'EXPIRED' : 'REVOKED'; old.desired = 'REVOKED'; old.revision++;
        await manager.save(old);
      }
      ban.created = new Date();
      ban.userUuid = uuid;
      const item = await this.createCase(manager, ban, ban.created.getTime());
      ban.punishmentId = item.id;
      await punishmentAudit(manager, 'account.issued', item.id, ban.actor?.uuid || null);
      return manager.save(Ban, ban);
    });
  }

  remove(uuid: string, actorUuid: string | null = null) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      await this.synchronize(manager, uuid);
      const ban = await manager.findOneBy(Ban, { userUuid: uuid });
      if (!ban) return;
      await this.revoke(manager, ban.punishmentId, actorUuid);
    });
  }

  cleanExpired() {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      await this.synchronize(manager);
      await manager.delete(Ban, { expires: LessThanOrEqual(new Date()) });
    });
  }

  async revoke(manager: EntityManager, id: string, actorUuid: string | null = null) {
    const item = await manager.findOneByOrFail(PunishmentCase, { id, category: 'ACCOUNT' });
    await manager.delete(Ban, { userUuid: item.subjectUuid, punishmentId: id });
    item.status = isExpired(item) ? 'EXPIRED' : 'REVOKED'; item.desired = 'REVOKED'; item.revision++;
    await manager.save(item);
    await punishmentAudit(manager, 'account.revoked', item.id, actorUuid);
    return item;
  }
}
