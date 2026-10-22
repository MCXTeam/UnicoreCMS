import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CacheKey } from '@common';
import { User } from 'src/admin/users/entities/user.entity';
import { Playtime } from '../cabinet/playtime/entities/playtime.entity';
import { ConnectIdentityService } from './connect-identity.service';
import { checkpointDelta } from './connect.protocol';
import { SessionsInput } from './dto/connect.input';
import { ConnectPlaytime, ConnectSession } from './entities/connect-session.entity';

@Injectable()
export class ConnectSessionsService {
  constructor(private identity: ConnectIdentityService, @Inject(CACHE_MANAGER) private cache: Cache) {}

  async update(input: SessionsInput, tokenId: string) {
    const result = await this.identity.withInstance(input, tokenId, async (manager, instance) => {
      const accepted: { sessionId: string; sequence: number }[] = [];
      for (const row of [...input.sessions].sort(
        (a, b) => a.userUuid.localeCompare(b.userUuid) || a.sessionId.localeCompare(b.sessionId),
      )) {
        const session = await manager.findOne(ConnectSession, { where: { sessionId: row.sessionId }, lock: { mode: 'pessimistic_write' } });
        if (session && (session.streamId !== instance.id || session.userUuid !== row.userUuid))
          throw new ConflictException('Session identity mismatch');
        let delta: ReturnType<typeof checkpointDelta>;
        try {
          delta = checkpointDelta(session, row);
        } catch (error) {
          throw new BadRequestException(error.message);
        }
        if (delta.accepted) {
          const id = createHash('sha256')
            .update(JSON.stringify([input.serverId, row.userUuid]))
            .digest('hex');
          const legacy = await manager.findOneBy(Playtime, { serverId: input.serverId, userUuid: row.userUuid });
          await manager
            .createQueryBuilder()
            .insert()
            .into(ConnectPlaytime)
            .values({
              id,
              serverId: input.serverId,
              userUuid: row.userUuid,
              baselineMs: (legacy?.time || 0) * 60000,
              activeMs: 0,
              connectedMs: 0,
            })
            .orIgnore()
            .execute();
          const total = await manager.findOneOrFail(ConnectPlaytime, { where: { id }, lock: { mode: 'pessimistic_write' } });
          total.connectedMs += delta.connectedMs;
          total.activeMs += delta.activeMs;
          await manager.save(total);
          await manager.save(ConnectSession, { ...row, streamId: instance.id });
          if (await manager.exists(User, { where: { uuid: row.userUuid } })) {
            await manager.upsert(
              Playtime,
              { serverId: input.serverId, userUuid: row.userUuid, time: Math.floor((total.baselineMs + total.activeMs) / 60000) },
              ['serverId', 'userUuid'],
            );
          }
        }
        accepted.push({ sessionId: row.sessionId, sequence: delta.accepted ? row.sequence : session!.sequence });
      }
      return { accepted };
    });
    await this.cache.del(CacheKey.Playtime);
    return result;
  }
}
