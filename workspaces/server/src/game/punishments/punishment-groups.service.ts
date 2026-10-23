import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConnectInstance } from '../connect/entities/connect-instance.entity';
import { PunishmentGroupInput } from './dto/punishment-management.input';
import { PunishmentGroup } from './entities/punishment-group.entity';
import { PunishmentCase } from './entities/punishment.entity';
import { PunishmentDeliveryService } from './punishment-delivery.service';
import { lockPunishments, punishmentAudit } from './punishment.model';

@Injectable()
export class PunishmentGroupsService {
  constructor(private dataSource: DataSource, private delivery: PunishmentDeliveryService) {}

  list() { return this.dataSource.getRepository(PunishmentGroup).find({ order: { name: 'ASC' } }); }

  save(input: PunishmentGroupInput, actorUuid: string) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      const previous = await manager.findOneBy(PunishmentGroup, { id: input.id });
      if ((previous?.revision || 0) !== input.revision) throw new ConflictException('Группа уже изменена, обновите страницу');
      if (!input.name.trim()) throw new BadRequestException('Укажите название группы');
      if (!input.unban || input.members.length !== new Set(input.members.map((member) => member.streamId)).size) throw new BadRequestException('Участники группы должны быть уникальными');
      const groups = await manager.find(PunishmentGroup);
      for (const member of input.members) {
        if (!(await manager.exists(ConnectInstance, { where: { id: member.streamId, retired: false } }))) throw new BadRequestException('Экземпляр Connect недоступен');
        for (const kind of input.kinds) if (!(await this.delivery.canManage(manager, member, kind, true, false))) throw new BadRequestException('Участник группы должен разрешать выдачу и снятие всех общих типов наказаний');
        if (member.primaryKinds.some((kind) => !input.kinds.includes(kind))) throw new BadRequestException('Основной тип должен быть общим в группе');
        if (input.enabled && groups.some((group) => group.id !== input.id && group.enabled && group.members.some((other) => other.streamId === member.streamId && other.providerId === member.providerId && other.primaryKinds.some((kind) => member.primaryKinds.includes(kind)))))
          throw new ConflictException('У экземпляра уже есть основная группа для этого типа');
      }
      const group = await manager.save(PunishmentGroup, { ...input, name: input.name.trim(), revision: input.revision + 1 });
      for (const item of await manager.findBy(PunishmentCase, { scopeType: 'GROUP', scopeId: group.id, status: 'ACTIVE' })) await this.delivery.reconcile(manager, item);
      await punishmentAudit(manager, previous ? 'group.updated' : 'group.created', null, actorUuid, { groupId: group.id, previous, current: group });
      return group;
    });
  }

  remove(id: string, revision: number, actorUuid: string, confirm: boolean) {
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      const group = await manager.findOneBy(PunishmentGroup, { id });
      if (!group) throw new NotFoundException();
      if (group.revision !== revision || !confirm) throw new ConflictException('Подтвердите удаление актуальной версии группы и снятие её наказаний');
      const active = await manager.findBy(PunishmentCase, { scopeType: 'GROUP', scopeId: id, status: 'ACTIVE' });
      group.enabled = false; group.members = []; group.revision++;
      await manager.save(group);
      for (const item of active) { item.desired = 'REVOKED'; item.revision++; await this.delivery.reconcile(manager, item); }
      await punishmentAudit(manager, 'group.removed', null, actorUuid, { groupId: id });
      return group;
    });
  }
}
