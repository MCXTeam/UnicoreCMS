import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Permission } from 'unicore-common';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { userPermissionCheck } from 'src/admin/roles/grant';
import { User } from 'src/admin/users/entities/user.entity';
import { ConnectInstance } from '../connect/entities/connect-instance.entity';
import { PunishmentCase } from './entities/punishment.entity';
import { PunishmentDeliveryService } from './punishment-delivery.service';

export type PunishmentAction = 'read' | 'issue' | 'revoke' | 'sale' | 'purchases';

@Injectable()
export class PunishmentAccess {
  constructor(private dataSource: DataSource, private delivery: PunishmentDeliveryService) {}

  async allows(request: any, action: PunishmentAction, item: PunishmentCase, manager: EntityManager = this.dataSource.manager) {
    if (!request?.user) return false;
    if (item.category === 'ACCOUNT') return matchPermission([action === 'read' ? 'panel.users.read' : action === 'sale' || action === 'purchases' ? `panel.punishments.${action}.account` : 'panel.users.ban'] as Permission[], request);
    const base = `panel.punishments.${action}`;
    if (await matchPermission([base as Permission], request)) return true;
    if (item.scopeType === 'NATIVE' && item.nativeBroad) return matchPermission([`${base}.project` as Permission], request);
    if (item.scopeType === 'PROJECT') return matchPermission([`${base}.project` as Permission], request);
    if (await matchPermission([`${base}.${item.scopeType === 'NATIVE' ? 'instance' : item.scopeType.toLowerCase()}:${item.scopeId}` as Permission], request)) return true;
    if (item.scopeType === 'INSTANCE' || item.scopeType === 'NATIVE') {
      const instance = await manager.findOneBy(ConnectInstance, { id: item.scopeId });
      return Boolean(instance && await matchPermission([`${base}.server:${instance.serverId}` as Permission], request));
    }
    if (item.scopeType === 'GROUP') return false;
    const targets = await this.delivery.targets(manager, item);
    if (!targets.length) return false;
    for (const target of targets) {
      const instance = await manager.findOneBy(ConnectInstance, { id: target.streamId });
      if (!instance || !(await matchPermission([[`${base}.instance:${instance.id}`, `${base}.server:${instance.serverId}`] as Permission[], { or: true }], request))) return false;
    }
    return true;
  }

  async assert(request: any, action: PunishmentAction, item: PunishmentCase, manager?: EntityManager) {
    if (!(await this.allows(request, action, item, manager))) throw new ForbiddenException('Нет доступа к этому наказанию');
    if (action !== 'read' && item.subjectUuid) {
      const target = await (manager || this.dataSource.manager).findOne(User, { where: { uuid: item.subjectUuid }, relations: ['roles'] });
      if (target && !(await userPermissionCheck(target, request.user))) throw new ForbiddenException('Недостаточно прав для управления наказанием этого игрока');
    }
  }
}
