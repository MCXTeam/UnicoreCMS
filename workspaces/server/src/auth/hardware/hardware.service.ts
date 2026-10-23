import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Brackets, DataSource, EntityManager, In, IsNull, MoreThan } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { HardwareBan, HardwareDevice, HardwareJoin, HardwareKey, HardwareRegistry, HardwareSession, HardwareUser } from './entities/hardware.entity';
import { AuditService } from 'src/common/audit/audit.service';
import { binaryValue, gravitComparison, hardwareHash, HardwareInfo, normalizeHardware } from './hardware-comparison';

export async function lockHardware(manager: EntityManager) {
  await manager.createQueryBuilder().insert().into(HardwareRegistry).values({ id: 'global' }).orUpdate(['id'], ['id']).execute();
  await manager.findOneOrFail(HardwareRegistry, { where: { id: 'global' }, lock: { mode: 'pessimistic_write' } });
}

export const activeHardwareBan = (ban: HardwareBan, now = Date.now()) => !ban.revokedAt && (!ban.expiresAt || ban.expiresAt.getTime() > now);

@Injectable()
export class HardwareService {
  constructor(private dataSource: DataSource, private audit: AuditService) {}

  async users(deviceId: string) { return (await this.dataSource.getRepository(HardwareUser).findBy({ deviceId })).map((link) => link.userUuid); }

  async recordJoin(userUuid: string, serverId: string, tokenId: number) {
    await this.dataSource.getRepository(HardwareJoin).save({ userUuid, serverId, tokenId, expiresAt: new Date(Date.now() + 300_000) });
  }

  async checkJoin(userUuid: string, serverId: string) {
    const join = await this.dataSource.getRepository(HardwareJoin).findOne({ where: { userUuid, serverId, expiresAt: MoreThan(new Date()) }, relations: ['token'] });
    if (!join?.token) throw new HttpException({ error: 'auth.invalidtoken' }, HttpStatus.UNAUTHORIZED);
    const state = await this.session(join.token.uuid, true);
    if (state.token.user.uuid !== userUuid) throw new HttpException({ error: 'auth.invalidtoken' }, HttpStatus.UNAUTHORIZED);
  }

  async launcherBan(deviceId: string, revoke: boolean, request: any) {
    let changed = false;
    const result = await this.dataSource.transaction(async (manager) => {
      await lockHardware(manager);
      const device = await manager.findOneBy(HardwareDevice, { id: deviceId });
      if (!device) throw new NotFoundException();
      const current = await this.activeBan(manager, deviceId);
      if (revoke && current) {
        current.revokedAt = new Date(); current.revokeReason = 'Снято через Gravit';
        await manager.save(current);
      } else if (!revoke && !current) await manager.save(HardwareBan, { id: randomUUID(), deviceId, reason: 'Блокировка через Gravit', expiresAt: null, actorUuid: null });
      if (Boolean(current) !== !revoke) {
        device.revision++;
        await manager.save(device);
        changed = true;
      }
      return this.view(device, undefined, manager);
    });
    if (changed) this.audit.record({ action: revoke ? 'hardware.revoke' : 'hardware.ban', ...this.audit.context(request), target: { type: 'hardware', id: deviceId }, meta: { launcher: 'gravit' } });
    return result;
  }

  async activeBan(manager: EntityManager, deviceId: string) {
    return manager.getRepository(HardwareBan).createQueryBuilder('ban').where('ban.deviceId = :deviceId', { deviceId })
      .andWhere('ban.revokedAt IS NULL').andWhere(new Brackets((qb) => qb.where('ban.expiresAt IS NULL').orWhere('ban.expiresAt > :now', { now: new Date() })))
      .orderBy('ban.issuedAt', 'DESC').getOne();
  }

  async view(device: HardwareDevice | null, publicKey?: string, manager = this.dataSource.manager) {
    if (!device) return null;
    const key = publicKey || (await manager.findOne(HardwareKey, { where: { deviceId: device.id }, order: { createdAt: 'DESC' } }))?.publicKey || null;
    return { id: device.id, publicKey: key, hardwareInfo: device.info, banned: Boolean(await this.activeBan(manager, device.id)) };
  }

  byId(id: string) { return this.dataSource.getRepository(HardwareDevice).findOneBy({ id }).then((device) => this.view(device)); }

  async byKey(value: string) {
    const key = binaryValue(value);
    const entry = await this.dataSource.getRepository(HardwareKey).findOneBy({ hash: hardwareHash(key) });
    return entry ? this.view(await this.dataSource.getRepository(HardwareDevice).findOneBy({ id: entry.deviceId }), key) : null;
  }

  private async matching(manager: EntityManager, info: HardwareInfo) {
    if (!info.hwDiskId && !info.baseboardSerialNumber && (!info.displayId || Buffer.from(info.displayId, 'base64').length < 4)) throw new BadRequestException('Аппаратный отчёт не содержит идентификаторов устройства');
    const devices = await manager.find(HardwareDevice, { order: { createdAt: 'ASC', id: 'ASC' } });
    const matches = devices.map((device) => ({ device, score: gravitComparison(device.info, info) })).filter(({ score }) => score > 1.0);
    if (!matches.length) return null;
    const banned = new Set((await manager.findBy(HardwareBan, { deviceId: In(matches.map(({ device }) => device.id)), revokedAt: IsNull() })).filter((ban) => activeHardwareBan(ban)).map((ban) => ban.deviceId));
    matches.sort((a, b) => Number(banned.has(b.device.id)) - Number(banned.has(a.device.id)) || b.score - a.score);
    return matches[0].device;
  }

  async byData(value: HardwareInfo) { return this.view(await this.matching(this.dataSource.manager, normalizeHardware(value))); }

  create(value: HardwareInfo, keyValue: string) {
    return this.dataSource.transaction(async (manager) => {
      await lockHardware(manager);
      const publicKey = binaryValue(keyValue), hash = hardwareHash(publicKey);
      const key = await manager.findOneBy(HardwareKey, { hash });
      let device = key ? await manager.findOneByOrFail(HardwareDevice, { id: key.deviceId }) : await this.matching(manager, normalizeHardware(value));
      if (!device) device = await manager.save(HardwareDevice, { id: randomUUID(), info: normalizeHardware(value), revision: 1 });
      if (!key) await manager.save(HardwareKey, { hash, deviceId: device.id, publicKey });
      return this.view(device, publicKey, manager);
    });
  }

  addKey(id: string, keyValue: string) {
    return this.dataSource.transaction(async (manager) => {
      await lockHardware(manager);
      const device = await manager.findOneByOrFail(HardwareDevice, { id });
      const publicKey = binaryValue(keyValue), hash = hardwareHash(publicKey);
      const existing = await manager.findOneBy(HardwareKey, { hash });
      if (existing && existing.deviceId !== id) throw new ConflictException('Ключ уже связан с другим устройством');
      if (!existing) await manager.save(HardwareKey, { hash, deviceId: id, publicKey });
      return this.view(device, publicKey, manager);
    });
  }

  async token(sessionID: string, manager = this.dataSource.manager) {
    const token = await manager.findOne(RefreshToken, { where: { uuid: sessionID, agent: 'launcher', expires: MoreThan(new Date()) }, relations: ['user', 'user.ban'] });
    if (!token) throw new HttpException({ error: 'auth.invalidtoken' }, HttpStatus.UNAUTHORIZED);
    return token;
  }

  async begin(sessionID: string, required: boolean, minecraftAccessToken: string) {
    const token = await this.token(sessionID);
    await this.dataSource.getRepository(HardwareSession).insert({ tokenId: token.id, required, deviceId: null, minecraftAccessToken });
  }

  async connect(sessionID: string, id: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      await lockHardware(manager);
      const token = await this.token(sessionID, manager);
      const device = await manager.findOneBy(HardwareDevice, { id });
      if (!device) throw new NotFoundException();
      const session = await manager.findOneBy(HardwareSession, { tokenId: token.id });
      if (session?.deviceId && session.deviceId !== id) throw new ConflictException('Устройство этой сессии уже подтверждено');
      await manager.save(HardwareSession, { ...session, tokenId: token.id, required: true, deviceId: id });
      const link = await manager.findOneBy(HardwareUser, { deviceId: id, userUuid: token.user.uuid });
      await manager.save(HardwareUser, { ...link, deviceId: id, userUuid: token.user.uuid, lastSeenAt: new Date() });
      return this.view(device, undefined, manager);
    });
    if (result.banned) this.denied();
    return result;
  }

  async session(sessionID: string, requireVerified: boolean) {
    const token = await this.token(sessionID);
    const session = await this.dataSource.getRepository(HardwareSession).findOneBy({ tokenId: token.id });
    if (session?.required && !session.deviceId && requireVerified) throw new HttpException({ error: 'auth.hardwarerequired' }, HttpStatus.FORBIDDEN);
    const hardware = session?.deviceId ? await this.byId(session.deviceId) : null;
    if (hardware?.banned) this.denied();
    return { token, hardware, required: session?.required || false, minecraftAccessToken: session?.minecraftAccessToken || token.user.accessToken };
  }

  private denied(): never { throw new HttpException({ error: 'auth.hardwarebanned' }, HttpStatus.FORBIDDEN); }
}
