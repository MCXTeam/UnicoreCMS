import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import { Server } from '../servers/entities/server.entity';
import { ConnectIdentityInput } from './dto/connect.input';
import { ConnectInstance } from './entities/connect-instance.entity';

@Injectable()
export class ConnectIdentityService {
  constructor(private dataSource: DataSource) {}

  streamId(input: Pick<ConnectIdentityInput, 'serverId' | 'instanceId'>): string {
    return createHash('sha256')
      .update(JSON.stringify([input.serverId, input.instanceId]))
      .digest('hex');
  }

  async diagnostics(serverId: string) {
    const rows = await this.dataSource.getRepository(ConnectInstance).findBy({ serverId });
    return rows.map(({ id, serverId, instanceId, bootId, epoch, sequence, registeredAt, lastSeenAt, retired }) => ({
      id,
      serverId,
      instanceId,
      bootId,
      epoch,
      sequence,
      registeredAt,
      lastSeenAt,
      retired,
    }));
  }

  async retire(id: string, authorize: (serverId: string) => Promise<void>) {
    return this.dataSource.transaction(async (manager) => {
      const instance = await manager.findOne(ConnectInstance, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!instance) throw new NotFoundException('Connect instance not found');
      await authorize(instance.serverId);
      instance.retired = true;
      instance.snapshot = null;
      await manager.save(instance);
      return { id, retired: true };
    });
  }

  async register(input: ConnectIdentityInput, tokenId: string) {
    return this.dataSource.transaction(async (manager) => {
      if (!(await manager.exists(Server, { where: { id: input.serverId } }))) throw new NotFoundException('Server not found');
      const id = this.streamId(input);
      await manager
        .createQueryBuilder()
        .insert()
        .into(ConnectInstance)
        .values({
          id,
          serverId: input.serverId,
          instanceId: input.instanceId,
          tokenId,
          bootId: '',
          epoch: 0,
          sequence: 0,
          registeredAt: new Date(),
          retired: false,
        })
        .orIgnore()
        .execute();
      const instance = await manager.findOneOrFail(ConnectInstance, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (instance.tokenId !== tokenId) throw new ForbiddenException('Instance belongs to another API token');
      if (instance.retired) throw new ForbiddenException('Connect instance is retired');
      if (instance.bootId !== input.bootId) {
        if (instance.epoch !== input.epoch && Date.now() - (instance.lastSeenAt || instance.registeredAt).getTime() <= 45_000)
          throw new ConflictException('Instance epoch mismatch');
        instance.bootId = input.bootId;
        instance.epoch += 1;
        instance.sequence = 0;
        instance.snapshot = null;
        instance.lastSeenAt = null;
        instance.registeredAt = new Date();
        await manager.save(instance);
      }
      return { protocol: 2, epoch: instance.epoch, heartbeatSeconds: 15, staleAfterSeconds: 45 };
    });
  }

  async withInstance<T>(
    input: ConnectIdentityInput,
    tokenId: string,
    action: (manager: EntityManager, instance: ConnectInstance) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const instance = await manager.findOne(ConnectInstance, { where: { id: this.streamId(input) }, lock: { mode: 'pessimistic_write' } });
      if (!instance || instance.tokenId !== tokenId || instance.retired) throw new ForbiddenException('Unknown Connect instance');
      if (instance.epoch !== input.epoch || instance.bootId !== input.bootId) throw new ConflictException('Stale Connect process');
      return action(manager, instance);
    });
  }
}
