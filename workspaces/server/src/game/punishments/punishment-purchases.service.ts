import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, In } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { creditUserBalance, debitUserBalance } from 'src/common/utils/balance';
import { History } from '../cabinet/history/entities/history.entity';
import { HistoryType } from '../cabinet/history/enums/history-type.enum';
import { PunishmentBinding, PunishmentCase } from './entities/punishment.entity';
import { PunishmentPurchase } from './entities/punishment-purchase.entity';
import { GamePunishment } from '../connect/entities/game-punishment.entity';
import { AccountRestrictionsService } from './account-restrictions.service';
import { PunishmentCoordinator } from './punishment-coordinator.service';
import { PunishmentPolicy } from './punishment-policy.service';
import { ACTIVE_PURCHASES, identityHash, lockPunishments, punishmentAudit } from './punishment.model';

@Injectable()
export class PunishmentPurchasesService {
  constructor(private dataSource: DataSource, private accounts: AccountRestrictionsService, private coordinator: PunishmentCoordinator, private policy: PunishmentPolicy) {}

  buy(userUuid: string, caseId: string, requestId: string, revision: number, ip: string | null, quotedPrice?: number) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      await this.accounts.synchronize(manager, userUuid);
      const replay = await manager.findOneBy(PunishmentPurchase, { buyerUuid: userUuid, requestId });
      if (replay) {
        if (replay.caseId !== caseId) throw new ConflictException('Этот запрос относится к другому наказанию');
        if (quotedPrice != null && (replay.amount !== quotedPrice || replay.snapshot.revision !== revision)) throw new ConflictException('Повторный запрос отличается от исходной покупки');
        return replay;
      }
      const item = await manager.findOneBy(PunishmentCase, { id: caseId });
      if (!item) throw new NotFoundException();
      if (item.subjectUuid !== userUuid) throw new ForbiddenException();
      const current = await manager.findOneBy(PunishmentPurchase, { caseId, status: In(ACTIVE_PURCHASES) });
      if (current) return current;
      if (item.revision !== revision) throw new ConflictException('Наказание изменилось, обновите сведения');
      const quote = await this.policy.quote(manager, item);
      if (!quote.available) throw new ConflictException(quote.reason);
      if (quotedPrice != null && quotedPrice !== quote.price) throw new ConflictException('Цена разбана изменилась, подтвердите актуальную стоимость');
      const bindings = (await manager.findBy(PunishmentBinding, { caseId })).filter((row) => row.member || row.status !== 'ABSENT');
      await debitUserBalance(manager.getRepository(User), userUuid, quote.price);
      const purchase = await manager.save(PunishmentPurchase, {
        id: randomUUID(), requestId, buyerUuid: userUuid, caseId, amount: quote.price, status: 'RESERVED', expiresAtMs: item.expiresAtMs, ip,
        snapshot: { reason: item.reason, scopeType: item.scopeType, scopeId: item.scopeId, revision: item.revision, targetBindingIds: bindings.map((row) => row.id) },
      });
      await punishmentAudit(manager, 'purchase.reserved', caseId, userUuid, { purchaseId: purchase.id, amount: purchase.amount });
      if (item.category === 'ACCOUNT') {
        await this.accounts.revoke(manager, item.id, userUuid);
        await this.finish(manager, purchase, 'COMPLETED', 'Блокировка аккаунта снята');
      } else {
        await this.coordinator.revoke(manager, item, userUuid, 'purchase.revoke.requested');
        await this.reconcile(manager, purchase);
      }
      return purchase;
    });
  }

  async buyAccount(user: User, ip: string) {
    const caseId = user.ban?.punishmentId;
    if (!caseId) throw new ConflictException('Обновите сведения о блокировке аккаунта');
    const item = await this.dataSource.getRepository(PunishmentCase).findOneBy({ id: caseId });
    if (!item) throw new NotFoundException();
    const hash = identityHash(user.uuid, caseId);
    const requestId = `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-8${hash.slice(17,20)}-${hash.slice(20,32)}`;
    return this.buy(user.uuid, caseId, requestId, item.revision, ip);
  }

  async reconcile(manager: EntityManager, purchase: PunishmentPurchase) {
    if (!ACTIVE_PURCHASES.includes(purchase.status)) return purchase;
    const bindings = purchase.snapshot.targetBindingIds.length ? await manager.findBy(PunishmentBinding, { id: In(purchase.snapshot.targetBindingIds) }) : [];
    const observedIds = bindings.map((binding) => binding.observedId).filter(Boolean);
    if (observedIds.length && await manager.exists(GamePunishment, { where: { id: In(observedIds), status: 'EXPIRED' } }))
      return this.finish(manager, purchase, 'REFUNDED', 'Игровая система подтвердила истечение наказания до завершения разбана');
    const confirmed = purchase.snapshot.targetBindingIds.length > 0 && bindings.length === purchase.snapshot.targetBindingIds.length && bindings.every((row) => row.status === 'ABSENT' && row.settledAtMs != null);
    const confirmedAtMs = confirmed ? Math.max(...bindings.map((row) => row.settledAtMs)) : null;
    if (confirmed && (purchase.expiresAtMs == null || confirmedAtMs < purchase.expiresAtMs))
      return this.finish(manager, purchase, 'COMPLETED', 'Снятие подтверждено на всех серверах');
    if (purchase.expiresAtMs != null && purchase.expiresAtMs <= Date.now())
      return this.finish(manager, purchase, 'REFUNDED', 'Срок наказания истёк до полного подтверждения снятия');
    if (purchase.status === 'RESERVED' && Date.now() - purchase.createdAt.getTime() >= 86_400_000) {
      purchase.status = 'REVIEW';
      await manager.save(PunishmentPurchase, purchase);
      await punishmentAudit(manager, 'purchase.review', purchase.caseId, null, { purchaseId: purchase.id });
    }
    return purchase;
  }

  private async finish(manager: EntityManager, purchase: PunishmentPurchase, status: string, reason: string) {
    if (!ACTIVE_PURCHASES.includes(purchase.status)) return purchase;
    if (status === 'REFUNDED') await creditUserBalance(manager.getRepository(User), purchase.buyerUuid, purchase.amount);
    else await manager.save(History, { type: HistoryType.UnabnPurchase, user: { uuid: purchase.buyerUuid }, ip: purchase.ip, real_spent: purchase.amount, virtual_spent: 0 });
    purchase.status = status; purchase.resolution = reason;
    await manager.save(PunishmentPurchase, purchase);
    await punishmentAudit(manager, status === 'REFUNDED' ? 'purchase.refunded' : 'purchase.completed', purchase.caseId, purchase.buyerUuid, { purchaseId: purchase.id, amount: purchase.amount, reason });
    return purchase;
  }

  resolve(id: string, action: string, reason: string, actorUuid: string) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      const purchase = await manager.findOneBy(PunishmentPurchase, { id });
      if (!purchase) throw new NotFoundException();
      if (!reason.trim()) throw new BadRequestException('Укажите основание решения');
      await this.reconcile(manager, purchase);
      if (!ACTIVE_PURCHASES.includes(purchase.status)) return purchase;
      if (action === 'COMPLETE') throw new ConflictException('Для списания требуется подтверждение снятия на всех серверах');
      await punishmentAudit(manager, 'purchase.refund.authorized', purchase.caseId, actorUuid, { purchaseId: id, reason });
      return this.finish(manager, purchase, 'REFUNDED', reason);
    });
  }
}
