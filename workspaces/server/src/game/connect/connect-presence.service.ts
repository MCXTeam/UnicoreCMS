import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { ConnectIdentityService } from './connect-identity.service';
import { PresenceInput } from './dto/connect.input';
import { ConnectInstance } from './entities/connect-instance.entity';
import { mergePresence, PresenceSnapshot } from './connect.protocol';

@Injectable()
export class ConnectPresenceService {
  constructor(private identity: ConnectIdentityService, private dataSource: DataSource) {}

  update(input: PresenceInput, tokenId: string) {
    return this.identity.withInstance(input, tokenId, async (manager, instance) => {
      if (input.sequence > instance.sequence) {
        instance.snapshot = {
          sequence: input.sequence,
          observedAtMs: input.observedAtMs,
          maxPlayers: input.maxPlayers,
          players: input.players,
        };
        instance.sequence = input.sequence;
        instance.lastSeenAt = new Date();
        await manager.save(instance);
      }
      return { sequence: instance.sequence };
    });
  }

  async overview(serverIds: string[]) {
    if (!serverIds.length) return { views: new Map(), network: null };
    const instances = await this.dataSource.getRepository(ConnectInstance).findBy({ serverId: In(serverIds), retired: false });
    const grouped = new Map<string, { snapshot: PresenceSnapshot; lastSeenAt: Date }[]>();
    const concealed = new Set<string>();
    for (const instance of instances) {
      const view = {
        snapshot: instance.snapshot || { sequence: 0, observedAtMs: 0, maxPlayers: 0, players: [] },
        lastSeenAt: instance.lastSeenAt || new Date(0),
      };
      for (const player of view.snapshot.players) if (player.visibility !== 'VISIBLE') concealed.add(player.uuid);
      const rows = grouped.get(instance.serverId) || [];
      rows.push(view);
      grouped.set(instance.serverId, rows);
    }
    const now = Date.now();
    return {
      views: new Map([...grouped].map(([serverId, samples]) => [serverId, mergePresence(samples, now, concealed)])),
      network: instances.length ? mergePresence([...grouped.values()].flat(), now, concealed) : null,
    };
  }

  async views(serverIds: string[]) {
    return (await this.overview(serverIds)).views;
  }
}
