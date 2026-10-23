import { SafeCron } from '@common';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource, In, IsNull } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { ServerInstance } from '../servers/entities/server-instance.entity';
import { GamePunishment } from '../connect/entities/game-punishment.entity';
import { PunishmentBinding, PunishmentCase } from './entities/punishment.entity';
import { PunishmentPurchase } from './entities/punishment-purchase.entity';
import { AccountRestrictionsService } from './account-restrictions.service';
import { PunishmentCoordinator } from './punishment-coordinator.service';
import { PunishmentDeliveryService } from './punishment-delivery.service';
import { PunishmentPurchasesService } from './punishment-purchases.service';
import { ACTIVE_PURCHASES, effectiveStatus, lockPunishments, punishmentAudit } from './punishment.model';

@Injectable()
export class PunishmentTasks implements OnApplicationBootstrap {
  private running = false;
  constructor(private dataSource: DataSource, private accounts: AccountRestrictionsService, private coordinator: PunishmentCoordinator, private delivery: PunishmentDeliveryService, private purchases: PunishmentPurchasesService) {}

  async onApplicationBootstrap() {
    do { await this.tick(); } while (await this.dataSource.getRepository(GamePunishment).existsBy({ caseId: IsNull() }));
  }

  @SafeCron('*/5 * * * * *', 'punishment-reconciliation')
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.dataSource.transaction(async (manager) => {
        await lockPunishments(manager);
        for (const instance of await manager.findBy(ServerInstance, { id: IsNull() })) {
          instance.id = randomUUID();
          await manager.save(instance);
        }
        await this.accounts.synchronize(manager);
        for (const row of await manager.find(GamePunishment, { where: { caseId: IsNull() }, order: { issuedAtMs: 'ASC' }, take: 200 }))
          await this.coordinator.observe(manager, row, 'SNAPSHOT');
        const pending = await manager.getRepository(PunishmentBinding).createQueryBuilder('binding').select('DISTINCT binding.caseId', 'caseId').where('binding.status <> :absent', { absent: 'ABSENT' }).andWhere('(binding.status <> :applied OR binding.desired = :revoked)', { applied: 'APPLIED', revoked: 'REVOKED' }).getRawMany();
        const due = await manager.getRepository(PunishmentCase).createQueryBuilder('punishment').where("punishment.category = 'GAME' AND punishment.status = 'ACTIVE' AND punishment.expiresAtMs <= :now", { now: Date.now() }).getMany();
        const ids = [...new Set([...pending.map((row) => row.caseId), ...due.map((row) => row.id)])];
        if (ids.length) for (const item of await manager.findBy(PunishmentCase, { id: In(ids) })) await this.delivery.reconcile(manager, item);
        for (const purchase of await manager.findBy(PunishmentPurchase, { status: In(ACTIVE_PURCHASES) })) await this.purchases.reconcile(manager, purchase);
        const conversions = await manager.getRepository(PunishmentCase).createQueryBuilder('punishment').where('punishment.migrationFromId IS NOT NULL AND punishment.status = :active', { active: 'ACTIVE' }).getMany();
        for (const item of conversions) {
          const bindings = await manager.findBy(PunishmentBinding, { caseId: item.id });
          const members = bindings.filter((row) => row.member);
          if (effectiveStatus(item) !== 'ACTIVE' || item.desired !== 'ACTIVE' || !members.length || members.some((row) => row.status !== 'APPLIED')) continue;
          const source = await manager.findOneBy(PunishmentCase, { id: item.migrationFromId, category: 'ACCOUNT' });
          if (source?.status === 'ACTIVE') {
            await this.accounts.revoke(manager, source.id);
            await punishmentAudit(manager, 'account.conversion.completed', source.id, null, { targetId: item.id });
          }
        }
      });
    } finally { this.running = false; }
  }
}
