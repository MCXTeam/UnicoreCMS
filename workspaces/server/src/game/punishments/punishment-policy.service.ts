import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ConfigService } from 'src/admin/config/config.service';
import { ConfigField } from 'src/admin/config/config.enum';
import { ConnectInstance } from '../connect/entities/connect-instance.entity';
import { GamePunishment } from '../connect/entities/game-punishment.entity';
import { In } from 'typeorm';
import { configFieldNumber } from 'src/admin/config/config.utils';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { PunishmentCase, PunishmentBinding } from './entities/punishment.entity';
import { PunishmentGroup, PunishmentSettings } from './entities/punishment-group.entity';
import { effectiveStatus } from './punishment.model';
import { PunishmentDeliveryService } from './punishment-delivery.service';

@Injectable()
export class PunishmentPolicy {
  constructor(private config: ConfigService, private delivery: PunishmentDeliveryService) {}
  canRevoke(manager: EntityManager, item: PunishmentCase) { return this.delivery.canRevoke(manager, item); }

  async quote(manager: EntityManager, item: PunishmentCase) {
    const denied = (reason: string) => ({ available: false, price: null as number | null, reason });
    if (item.kind !== 'BAN') return denied('Это наказание снимает модератор');
    if (effectiveStatus(item) !== 'ACTIVE') return denied('Наказание уже не действует');
    if (item.desired !== 'ACTIVE') return denied('Снятие наказания уже выполняется');
    if (item.saleBlocked) return denied(item.saleBlockedReason || 'Покупка разбана запрещена модератором');
    if (item.category === 'ACCOUNT') {
      if (await manager.exists(PunishmentCase, { where: { migrationFromId: item.id, status: 'ACTIVE' } })) return denied('Выполняется перенос блокировки в игровое наказание');
      const config = await this.config.load();
      return { available: true, price: currencyUtils.roundByType(configFieldNumber(config, ConfigField.UnbanPrice), SystemCurrency.REAL), reason: null as string | null };
    }
    const settings = await manager.findOneBy(PunishmentSettings, { id: 'global' });
    const bindings = (await manager.findBy(PunishmentBinding, { caseId: item.id })).filter((row) => row.member || row.status !== 'ABSENT');
    let rule = { enabled: null as boolean | null, price: null as number | null };
    if (item.scopeType === 'GROUP') rule = (await manager.findOneBy(PunishmentGroup, { id: item.scopeId }))?.unban || rule;
    else if (item.scopeType === 'SERVER') rule = settings?.servers[item.scopeId] || rule;
    else if (bindings.length === 1 && !item.nativeBroad) {
      const stream = await manager.findOneBy(ConnectInstance, { id: bindings[0].streamId });
      rule = settings?.servers[stream?.serverId] || rule;
    }
    if (!(rule.enabled ?? settings?.gameUnbanEnabled)) return denied('Покупка разбана для этой области отключена');
    if (!bindings.length || bindings.some((binding) => binding.status !== 'APPLIED' || binding.desired !== 'ACTIVE')) return denied('Ожидается согласование наказания на серверах');
    if ((await manager.findBy(GamePunishment, { id: In(bindings.map((binding) => binding.observedId).filter(Boolean)) })).some((row) => row.payload.manageable === false)) return denied('Это наказание снимается в игровой системе модерации');
    for (const binding of bindings) if (!(await this.delivery.canManage(manager, binding, item.kind, false, false))) return denied('Провайдер не разрешает снятие с сайта');
    return { available: true, price: currencyUtils.roundByType(rule.price ?? settings?.gameUnbanPrice ?? 150, SystemCurrency.REAL), reason: null as string | null };
  }
}
