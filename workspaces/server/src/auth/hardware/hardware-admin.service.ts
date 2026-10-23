import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, In } from 'typeorm';
import { AuditService } from 'src/common/audit/audit.service';
import { User } from 'src/admin/users/entities/user.entity';
import { userPermissionCheck } from 'src/admin/roles/grant';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { HardwareBan, HardwareDevice, HardwareUser } from './entities/hardware.entity';
import { activeHardwareBan, HardwareService, lockHardware } from './hardware.service';
import { HardwareBanInput, HardwareRevokeInput } from './dto/hardware.input';

@Injectable()
export class HardwareAdminService {
  constructor(private dataSource: DataSource, private hardware: HardwareService, private audit: AuditService) {}

  private async assertHierarchy(manager: EntityManager, deviceIds: string[], actor: User) {
    const links = await manager.findBy(HardwareUser, { deviceId: In(deviceIds) });
    const uuids = [...new Set(links.map((link) => link.userUuid))];
    if (uuids.length) for (const user of await manager.find(User, { where: { uuid: In(uuids) }, relations: ['roles'] }))
      if (!(await userPermissionCheck(user, actor))) throw new ForbiddenException('Недостаточно прав для управления оборудованием связанного аккаунта');
  }

  async list(userUuid: string, request: any) {
    if (!(await this.dataSource.getRepository(User).existsBy({ uuid: userUuid }))) throw new NotFoundException();
    const links = await this.dataSource.getRepository(HardwareUser).find({ where: { userUuid }, relations: ['device'], order: { lastSeenAt: 'DESC' } });
    const data = [];
    for (const link of links) {
      const users = await this.dataSource.getRepository(HardwareUser).find({ where: { deviceId: link.deviceId }, relations: ['user', 'user.roles'], order: { lastSeenAt: 'DESC' } });
      const history = await this.dataSource.getRepository(HardwareBan).find({ where: { deviceId: link.deviceId }, order: { issuedAt: 'DESC' }, take: 50 });
      const actorIds = [...new Set(history.flatMap((ban) => [ban.actorUuid, ban.revokedByUuid]).filter(Boolean))];
      const actors = actorIds.length ? await this.dataSource.getRepository(User).find({ where: { uuid: In(actorIds) }, select: ['uuid', 'username'] }) : [];
      let manageable = true;
      for (const row of users) if (!(await userPermissionCheck(row.user, request.user))) manageable = false;
      data.push({ id: link.device.id, revision: link.device.revision, info: link.device.info, firstSeenAt: link.firstSeenAt, lastSeenAt: link.lastSeenAt,
        users: users.map(({ user }) => ({ uuid: user.uuid, username: user.username })), history: history.map((ban) => ({ ...this.banView(ban), actorName: actors.find((user) => user.uuid === ban.actorUuid)?.username || null, revokedByName: actors.find((user) => user.uuid === ban.revokedByUuid)?.username || null, status: ban.revokedAt ? 'REVOKED' : activeHardwareBan(ban) ? 'ACTIVE' : 'EXPIRED' })),
        activeBan: history.find((ban) => activeHardwareBan(ban)) ? this.banView(history.find((ban) => activeHardwareBan(ban))) : null,
        canBan: manageable && await matchPermission(['panel.users.hardware.ban'], request), canRevoke: manageable && await matchPermission(['panel.users.hardware.revoke'], request),
      });
    }
    this.audit.record({ action: 'hardware.read', ...this.audit.context(request), target: { type: 'user', id: userUuid }, meta: { devices: data.length } });
    return { data };
  }

  private banView(ban: HardwareBan) {
    return { id: ban.id, reason: ban.reason, actorUuid: ban.actorUuid, issuedAt: ban.issuedAt, expiresAt: ban.expiresAt, revokedAt: ban.revokedAt, revokedByUuid: ban.revokedByUuid, revokeReason: ban.revokeReason };
  }

  async ban(input: HardwareBanInput, request: any) {
    const result = await this.dataSource.transaction(async (manager) => {
      await lockHardware(manager);
      if (!input.reason.trim()) throw new ConflictException('Укажите причину блокировки');
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      if (expiresAt && expiresAt.getTime() <= Date.now()) throw new ConflictException('Срок блокировки уже истёк');
      const ids = [...new Set(input.devices.map((device) => device.id))];
      if (ids.length !== input.devices.length) throw new ConflictException('Устройство указано несколько раз');
      await this.assertHierarchy(manager, ids, request.user);
      const result = [];
      for (const value of input.devices) {
        if (!(await manager.existsBy(HardwareUser, { deviceId: value.id, userUuid: input.userUuid }))) throw new NotFoundException('Устройство не связано с этим игроком');
        const device = await manager.findOneByOrFail(HardwareDevice, { id: value.id });
        if (device.revision !== value.revision) throw new ConflictException('Сведения об устройстве изменились');
        if (await this.hardware.activeBan(manager, device.id)) throw new ConflictException('Устройство уже заблокировано');
        const ban = await manager.save(HardwareBan, { id: randomUUID(), deviceId: device.id, reason: input.reason.trim(), actorUuid: request.user.uuid, expiresAt });
        device.revision++;
        await manager.save(device);
        result.push(this.banView(ban));
      }
      return result;
    });
    for (let index = 0; index < result.length; index++) this.audit.record({ action: 'hardware.ban', ...this.audit.context(request), target: { type: 'hardware', id: input.devices[index].id }, meta: { banId: result[index].id, reason: input.reason.trim(), expiresAt: input.expiresAt || null } });
    return result;
  }

  async revoke(deviceId: string, input: HardwareRevokeInput, request: any) {
    let changed = false;
    const result = await this.dataSource.transaction(async (manager) => {
      await lockHardware(manager);
      if (!input.reason.trim()) throw new ConflictException('Укажите основание снятия');
      await this.assertHierarchy(manager, [deviceId], request.user);
      const device = await manager.findOneByOrFail(HardwareDevice, { id: deviceId });
      const ban = await manager.findOneBy(HardwareBan, { id: input.banId, deviceId });
      if (!ban) throw new NotFoundException();
      if (ban.revokedAt) return this.banView(ban);
      if (device.revision !== input.revision) throw new ConflictException('Блокировка устройства изменилась');
      if (!activeHardwareBan(ban)) throw new ConflictException('Срок блокировки уже истёк');
      ban.revokedAt = new Date(); ban.revokedByUuid = request.user.uuid; ban.revokeReason = input.reason.trim();
      await manager.save(ban);
      device.revision++;
      await manager.save(device);
      changed = true;
      return this.banView(ban);
    });
    if (changed) this.audit.record({ action: 'hardware.revoke', ...this.audit.context(request), target: { type: 'hardware', id: deviceId }, meta: { banId: result.id, reason: input.reason.trim() } });
    return result;
  }
}
