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

@Injectable()
export class GamePunishmentsService {
  constructor(private identity: ConnectIdentityService, private dataSource: DataSource) {}

  events(input: PunishmentEventsInput, tokenId: string) {
    return this.identity.withInstance(input, tokenId, async (manager, instance) => {
      const accepted: string[] = [];
      for (const event of input.events) {
        const payload = event.punishment;
        if (!payload.subject || !payload.scope || payload.scope.serverId !== input.serverId)
          throw new BadRequestException('Punishment scope mismatch');
        this.validateSubject(payload);
        if (payload.expiresAtMs != null && payload.expiresAtMs < payload.issuedAtMs) throw new BadRequestException('Invalid expiry');
        const id = createHash('sha256')
          .update(JSON.stringify([instance.id, payload.providerId, payload.kind, payload.externalId]))
          .digest('hex');
        const received = await manager.findOneBy(GamePunishmentEvent, { eventId: event.eventId });
        if (received && (received.streamId !== instance.id || received.punishmentId !== id))
          throw new ConflictException('Event identity mismatch');
        if (!received) {
          await manager.save(GamePunishmentEvent, {
            eventId: event.eventId,
            streamId: instance.id,
            punishmentId: id,
            payload: { ...payload },
          });
          const existing = await manager.findOne(GamePunishment, { where: { id }, lock: { mode: 'pessimistic_write' } });
          const resurrected = existing && existing.payload.status !== 'ACTIVE' && payload.status === 'ACTIVE';
          if (!resurrected)
            await manager.save(GamePunishment, {
              id,
              streamId: instance.id,
              serverId: input.serverId,
              providerId: payload.providerId,
              status: payload.status,
              issuedAtMs: payload.issuedAtMs,
              subjectUuid: payload.subject.kind === 'PLAYER' ? payload.subject.value : null,
              payload: { ...payload, id, scope: { ...payload.scope, instanceId: instance.instanceId } },
              revision: (existing?.revision || 0) + 1,
            });
        }
        accepted.push(event.eventId);
      }
      return { accepted };
    });
  }

  poll(input: PunishmentPollInput, tokenId: string) {
    return this.identity.withInstance(input, tokenId, async (manager, instance) => {
      const filter = { serverId: input.serverId, providerId: input.providerId, status: 'PENDING' };
      const commands = await manager.find(GamePunishmentCommand, {
        where: { ...filter, streamId: instance.id },
        lock: { mode: 'pessimistic_write' },
        order: { createdAt: 'ASC', commandId: 'ASC' },
        take: 50,
      });
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
      const command = await manager.findOne(GamePunishmentCommand, {
        where: { commandId: input.commandId, serverId: input.serverId, streamId: instance.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!command) throw new NotFoundException('Command not found');
      if (command.status === 'PENDING') {
        command.status = input.result.status;
        command.result = input.result;
        await manager.save(command);
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
      const existingCommand = await manager.findOneBy(GamePunishmentCommand, { commandId: input.commandId });
      if (existingCommand) {
        if (existingCommand.requestHash !== requestHash) throw new ConflictException('Command identity mismatch');
        return { commandId: existingCommand.commandId, status: existingCommand.status };
      }
      let target = input.punishment;
      let streamId: string;
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
      const payload = { ...input, punishment: { ...target, actor: { uuid: actor.uuid, name: actor.username, console: false } } };
      await manager.save(GamePunishmentCommand, {
        commandId: input.commandId,
        requestHash,
        streamId,
        serverId,
        providerId: input.punishment.providerId,
        status: 'PENDING',
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

  async command(commandId: string) {
    const command = await this.dataSource.getRepository(GamePunishmentCommand).findOneBy({ commandId });
    if (!command) throw new NotFoundException('Command not found');
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
