import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { DataSource, MoreThan } from 'typeorm';
import { isIP, isUUID } from 'class-validator';
import { isIP as ipVersion } from 'node:net';
import { User } from 'src/admin/users/entities/user.entity';
import { userPermissionCheck } from 'src/admin/roles/grant';
import { Server } from '../servers/entities/server.entity';
import { ConnectIdentityService } from './connect-identity.service';
import { PunishmentAckInput, PunishmentCommandInput, PunishmentEventsInput, PunishmentPollInput } from './dto/punishment.input';
import { GamePunishment, GamePunishmentCommand, GamePunishmentEvent } from './entities/game-punishment.entity';
import { ConnectInstance } from './entities/connect-instance.entity';
import { PunishmentCoordinator } from '../punishments/punishment-coordinator.service';
import { PunishmentDeliveryService } from '../punishments/punishment-delivery.service';
import { PunishmentAccess } from '../punishments/punishment-access.service';
import { PunishmentCase, PunishmentProviderState } from '../punishments/entities/punishment.entity';
import { identityHash, lockPunishments } from '../punishments/punishment.model';
import { saveObservation } from '../punishments/punishment-observations';

@Injectable()
export class GamePunishmentsService {
  constructor(private identity: ConnectIdentityService, private dataSource: DataSource, private coordinator: PunishmentCoordinator, private delivery: PunishmentDeliveryService, private access: PunishmentAccess) {}

  events(input: PunishmentEventsInput, tokenId: string) {
    return this.identity.withInstance(input, tokenId, async (manager, instance) => {
      await lockPunishments(manager);
      const accepted: string[] = [];
      for (const event of input.events) {
        const payload = event.punishment;
        if (!payload.subject || !payload.scope || payload.scope.serverId !== input.serverId)
          throw new BadRequestException('Punishment scope mismatch');
        this.validateSubject(payload);
        if (payload.expiresAtMs != null && payload.expiresAtMs < payload.issuedAtMs) throw new BadRequestException('Invalid expiry');
        const { row, changed } = await saveObservation(manager, instance, payload, event.eventId);
        if (row && (changed || !row.caseId)) await this.coordinator.observe(manager, row, event.origin, event.commandId);
        accepted.push(event.eventId);
      }
      return { accepted };
    });
  }

  poll(input: PunishmentPollInput, tokenId: string) {
    return this.identity.withInstance(input, tokenId, async (manager, instance) => {
      await lockPunishments(manager);
      if (input.descriptor) {
        if (input.descriptor.id !== input.providerId || !input.mode) throw new BadRequestException('Provider descriptor mismatch');
        await manager.save(PunishmentProviderState, { id: identityHash(instance.id, input.providerId), streamId: instance.id, providerId: input.providerId, mode: input.mode, capabilities: input.descriptor.capabilities, version: input.descriptor.version, seenAt: new Date() });
        const cases = await manager.getRepository(PunishmentCase).createQueryBuilder('punishment')
          .where("punishment.category = 'GAME' AND punishment.status = 'ACTIVE' AND punishment.desired = 'ACTIVE'")
          .andWhere("(punishment.scopeType = 'PROJECT' OR (punishment.scopeType = 'SERVER' AND punishment.scopeId = :serverId))", { serverId: instance.serverId }).getMany();
        for (const item of cases) await this.delivery.reconcile(manager, item);
      }
      const filter = { serverId: input.serverId, providerId: input.providerId, status: 'PENDING' };
      const commands = await manager.find(GamePunishmentCommand, {
        where: { ...filter, streamId: instance.id },
        lock: { mode: 'pessimistic_write' },
        order: { createdAt: 'ASC', commandId: 'ASC' },
        take: 50,
      });
      for (const command of commands) if (command.offeredAt == null) { command.offeredAt = new Date(); await manager.save(command); }
      const tracked = await manager.find(GamePunishment, {
        where: {
          streamId: instance.id,
          serverId: input.serverId,
          providerId: input.providerId,
          ...(input.cursor ? { id: MoreThan(input.cursor) } : {}),
        },
        order: { id: 'ASC' },
        take: 500,
      });
      return {
        commands: commands.map((row) => row.payload),
        tracked: tracked.filter((row) => row.payload.status === 'ACTIVE').map((row) => ({ ...row.payload, revision: row.revision })),
        cursor: tracked.length === 500 ? tracked[tracked.length - 1].id : null,
      };
    });
  }

  acknowledge(input: PunishmentAckInput, tokenId: string) {
    return this.identity.withInstance(input, tokenId, async (manager, instance) => {
      await lockPunishments(manager);
      const command = await manager.findOne(GamePunishmentCommand, {
        where: { commandId: input.commandId, serverId: input.serverId, streamId: instance.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!command) throw new NotFoundException('Command not found');
      if (command.status === 'PENDING' || command.status === 'UNKNOWN' && ['APPLIED', 'ALREADY_APPLIED'].includes(input.result.status)) {
        command.status = input.result.status;
        command.result = input.result;
        await manager.save(command);
        if (input.result.observed) {
          const observed = input.result.observed;
          const target = command.payload.punishment;
          if (observed.providerId !== command.providerId || observed.kind !== target.kind || observed.subject.kind !== target.subject.kind || observed.subject.value !== target.subject.value || input.result.externalId && observed.externalId !== input.result.externalId)
            throw new ConflictException('Command observation mismatch');
          this.validateSubject(observed);
          const saved = await saveObservation(manager, instance, observed);
          if (saved.row) await this.coordinator.observe(manager, saved.row, 'COMMAND', command.commandId);
        }
        await this.delivery.acknowledge(manager, command);
      }
      return { commandId: command.commandId, status: command.status };
    });
  }

  async enqueue(actor: User, input: PunishmentCommandInput) {
    const serverId = input.punishment.scope?.serverId;
    if (!serverId || !(await this.dataSource.getRepository(Server).existsBy({ id: serverId })))
      throw new NotFoundException('Server not found');
    this.validateSubject(input.punishment);
    const p = input.punishment;
    const requestHash = createHash('sha256')
      .update(
        JSON.stringify([
          actor.uuid,
          input.revoke,
          input.expectedRevision ?? null,
          p.id,
          p.providerId,
          p.externalId,
          p.subject.kind,
          p.subject.value,
          p.kind,
          p.scope.serverId,
          p.scope.instanceId ?? null,
          p.scope.networkId ?? null,
          p.reason,
          p.issuedAtMs,
          p.expiresAtMs ?? null,
          p.status,
        ]),
      )
      .digest('hex');
    return this.dataSource.transaction(async (manager) => {
      await lockPunishments(manager);
      const existingCommand = await manager.findOneBy(GamePunishmentCommand, { commandId: input.commandId });
      if (existingCommand) {
        if (existingCommand.requestHash !== requestHash) throw new ConflictException('Command identity mismatch');
        return { commandId: existingCommand.commandId, status: existingCommand.status };
      }
      let target = input.punishment;
      let streamId: string;
      let logicalCase: PunishmentCase | null = null;
      if (input.revoke) {
        const punishment = await manager.findOne(GamePunishment, {
          where: { id: input.punishment.id, serverId },
          lock: { mode: 'pessimistic_write' },
        });
        if (
          !punishment ||
          punishment.providerId !== input.punishment.providerId ||
          punishment.payload.externalId !== input.punishment.externalId
        )
          throw new NotFoundException('Punishment not found');
        if (input.expectedRevision !== punishment.revision) throw new ConflictException('Punishment revision mismatch');
        target = { ...punishment.payload, revision: punishment.revision } as typeof target;
        streamId = punishment.streamId;
        if (punishment.caseId) logicalCase = await manager.findOneBy(PunishmentCase, { id: punishment.caseId });
      } else {
        const candidates = await manager.find(ConnectInstance, {
          where: { serverId, retired: false, ...(target.scope.instanceId ? { instanceId: target.scope.instanceId } : {}) },
        });
        if (candidates.length !== 1) throw new ConflictException('Choose one registered Connect instance');
        streamId = candidates[0].id;
        target = { ...target, scope: { ...target.scope, instanceId: candidates[0].instanceId } };
      }
      if (target.subject.kind === 'PLAYER') {
        const user = await manager.findOneBy(User, { uuid: target.subject.value });
        if (user && !(await userPermissionCheck(user, actor))) throw new ForbiddenException();
      }
      const item = manager.create(PunishmentCase, { category: 'GAME', scopeType: 'INSTANCE', scopeId: streamId, subjectUuid: target.subject.kind === 'PLAYER' ? target.subject.value : null });
      await this.access.assert({ user: actor }, input.revoke ? 'revoke' : 'issue', logicalCase || item, manager);
      const payload = { ...input, punishment: { ...target, actor: { uuid: actor.uuid, name: actor.username, console: false } } };
      await manager.save(GamePunishmentCommand, {
        commandId: input.commandId,
        requestHash,
        streamId,
        serverId,
        providerId: input.punishment.providerId,
        status: 'PENDING',
        offeredAt: null,
        payload,
      });
      return { commandId: input.commandId, status: 'PENDING' };
    });
  }

  private validateSubject(punishment: { subject: { kind: string; value: string } }) {
    const { kind, value } = punishment.subject;
    const [address, prefix, extra] = value.split('/');
    const cidr =
      !extra && /^\d{1,3}$/.test(prefix || '') && ipVersion(address) > 0 && Number(prefix) <= (ipVersion(address) === 4 ? 32 : 128);
    if (kind === 'PLAYER' ? !isUUID(value) : kind === 'IP' ? !isIP(value) : kind === 'CIDR' ? !cidr : true)
      throw new BadRequestException('Invalid punishment subject');
  }

  async command(commandId: string, actor: User) {
    const command = await this.dataSource.getRepository(GamePunishmentCommand).findOneBy({ commandId });
    if (!command) throw new NotFoundException('Command not found');
    const item = command.caseId ? await this.dataSource.getRepository(PunishmentCase).findOneBy({ id: command.caseId }) : this.dataSource.manager.create(PunishmentCase, { category: 'GAME', scopeType: 'INSTANCE', scopeId: command.streamId });
    if (!item || !(await this.access.allows({ user: actor }, 'read', item)) && !(await this.access.allows({ user: actor }, command.payload.revoke ? 'revoke' : 'issue', item))) throw new ForbiddenException();
    return {
      commandId,
      serverId: command.serverId,
      providerId: command.providerId,
      status: command.status,
      result: command.result,
      createdAt: command.createdAt,
    };
  }

  async forPlayer(uuid: string) {
    const repository = this.dataSource.getRepository(GamePunishment);
    const [active, recent] = await Promise.all([
      repository.find({ where: { subjectUuid: uuid, status: 'ACTIVE' }, order: { issuedAtMs: 'DESC', id: 'ASC' }, take: 1000 }),
      repository.find({ where: { subjectUuid: uuid }, order: { issuedAtMs: 'DESC', id: 'ASC' }, take: 100 }),
    ]);
    const rows = [...new Map([...active, ...recent].map((row) => [row.id, row])).values()];
    return rows.map((row) => ({
      ...row.payload,
      revision: row.revision,
      status:
        row.payload.status === 'ACTIVE' && row.payload.expiresAtMs && row.payload.expiresAtMs <= Date.now()
          ? 'EXPIRED'
          : row.payload.status,
    }));
  }
}
