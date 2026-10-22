import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Online } from './entities/online.entity';
import _ from 'lodash';
import { pingMinecraft } from './minecraft-ping';
import { Server } from '../entities/server.entity';
import { ServerInstance } from '../entities/server-instance.entity';
import moment from 'moment';
import { UpdateOnline } from './interfaces/update-online.interface';
import { Onlines } from './dto/onlines.dto';
import { OnlinesRecord } from './entities/onlines-record.entity';
import { OnlinesAbsoluteRecord } from './entities/onlines-absolute-record.entity';
import { RecordOnlineInterface } from './interfaces/record-online.interface';
import { classToPlain } from 'class-transformer';
import { DEFAULT_MINECRAFT_PORT, PING_TIMEOUT_MS } from '@common';
import { ConnectPresenceService } from '../../connect/connect-presence.service';
import { PresenceView } from '../../connect/connect.protocol';

@Injectable()
export class OnlineService {
  constructor(
    @InjectRepository(Online)
    private onlineRepository: Repository<Online>,
    @InjectRepository(ServerInstance)
    private instancesRepository: Repository<ServerInstance>,
    @InjectRepository(OnlinesRecord)
    private onlinesRecordsRepository: Repository<OnlinesRecord>,
    @InjectRepository(OnlinesAbsoluteRecord)
    private onlinesAbsoluteRecordsRepository: Repository<OnlinesAbsoluteRecord>,
    private connectPresence: ConnectPresenceService,
  ) {}

  async find(): Promise<Onlines> {
    const servers = _.orderBy(
      await this.onlineRepository.find({
        relations: ['server', 'server.instances'],
      }),
      ['server.priority'],
      ['asc'],
    );
    const { views: presence, network } = await this.connectPresence.overview(servers.map((server) => server.serverId));
    for (const server of servers) {
      const view = presence.get(server.serverId);
      if (view) {
        Object.assign(server, view);
        server.server.instances = server.server.instances?.map((instance) => ({ ...instance, online: null, players: null, maxplayers: null }));
      }
    }
    const record = await this.onlinesRecordsRepository.findOne({
      order: { created: 'DESC' },
      where: { created: MoreThanOrEqual(moment().utc().startOf('day').toDate()) },
    });
    const absolute = (
      await this.onlinesAbsoluteRecordsRepository.find({
        order: { online: 'DESC' },
        take: 1,
      })
    )[0];

    return {
      servers,
      total: {
        online: servers.some((server) => server.players == null) ? null : (network?.players || 0) + _.sumBy(servers.filter((server) => !presence.has(server.serverId)), 'players'),
        aggregation: presence.size === servers.length ? 'unique' : presence.size ? 'mixed' : 'count-only',
        freshness: servers.some((server) => server.players == null) ? 'stale' : 'fresh',
        records: {
          today: {
            online: record?.online || 0,
            created: moment(record?.updated).utc().toDate(),
          },
          absolute: {
            online: absolute?.online || 0,
            created: moment(absolute?.created).utc().toDate(),
          },
        },
      },
    };
  }

  async updateOnlinesRecords(): Promise<Onlines> {
    const onlines: Onlines = await this.find();
    if (onlines.total.online == null || onlines.total.aggregation === 'mixed') return onlines;
    let today: RecordOnlineInterface;
    let absolute: RecordOnlineInterface;

    const id = (
      await this.onlinesRecordsRepository.findOne({
        order: { created: 'DESC' },
        where: { created: MoreThanOrEqual(moment().utc().startOf('day').toDate()) },
      })
    )?.id;

    if (onlines.total.online > onlines.total.records.absolute.online) {
      const entity = await this.onlinesAbsoluteRecordsRepository.save({
        online: onlines.total.online,
      });
      absolute = { online: entity.online, created: entity.created };
    }

    if (!id || onlines.total.online > onlines.total.records.today.online) {
      if (moment(onlines.total.records.today.created).utc().isSame(moment().utc(), 'day') && id) {
        await this.onlinesRecordsRepository
          .createQueryBuilder()
          .update(OnlinesRecord)
          .set({
            online: onlines.total.online,
            updated: moment().utc().toDate(),
          })
          .where('id = :id', { id })
          .execute();

        today = {
          online: onlines.total.online,
          created: moment().utc().toDate(),
        };
      } else {
        const entity = await this.onlinesRecordsRepository.save({
          online: onlines.total.online,
        });

        today = {
          online: entity.online,
          created: entity.created,
        };
      }
    }

    if (absolute) onlines.total.records.absolute = absolute;

    if (today) onlines.total.records.today = today;

    return onlines;
  }

  async publicServer(server: Server): Promise<Server> {
    const view = (await this.connectPresence.views([server.id])).get(server.id);
    if (view) {
      if (server.online) Object.assign(server.online, view);
      if (server.instances) server.instances = server.instances.map((instance) => ({ ...instance, online: null, players: null, maxplayers: null }));
    }
    return server;
  }

  private async ping(host: string, port?: number): Promise<Pick<Online, 'maxplayers' | 'online' | 'players'>> {
    const status = await pingMinecraft(host, port || DEFAULT_MINECRAFT_PORT, PING_TIMEOUT_MS).catch(() => null);

    if (!status) return { maxplayers: 0, players: 0, online: false };

    return { maxplayers: status.max, players: status.online, online: true };
  }

  private async updateInstances(server: Server): Promise<Pick<Online, 'maxplayers' | 'online' | 'players'>> {
    const reachable = server.instances.filter((instance) => instance.host);

    const states = await Promise.all(
      reachable.map(async (instance) => {
        const state = await this.ping(instance.host, instance.port);

        if (instance.online !== state.online || instance.players !== state.players || instance.maxplayers !== state.maxplayers) {
          await this.instancesRepository
            .createQueryBuilder()
            .update(ServerInstance)
            .set(state)
            .where('server_id = :id AND priority = :priority', { id: server.id, priority: instance.priority })
            .execute();

          Object.assign(instance, state);
        }

        return state;
      }),
    );

    return {
      players: _.sumBy(states, 'players'),
      maxplayers: _.sumBy(states, 'maxplayers'),
      online: states.some((state) => state.online),
    };
  }

  async updateAll(servers: Server[]): Promise<UpdateOnline[]> {
    const views = await this.connectPresence.views(servers.map((server) => server.id));
    return Promise.all(servers.map((server) => this.updateOnline(server, views.get(server.id) || null)));
  }

  async updateOnline(server: Server, presence?: PresenceView | null): Promise<UpdateOnline> {
    const hasInstances = Boolean(server.instances?.length);

    const view = presence === undefined ? (await this.connectPresence.views([server.id])).get(server.id) : presence;
    if (!server.online || (!view && !hasInstances && !server.query?.host)) {
      return {
        instance: server,
        updated: false,
      };
    }

    const ping = hasInstances ? await this.updateInstances(server) : server.query?.host ? await this.ping(server.query.host, server.query.port) : null;
    const online = view ? { online: view.online, players: view.players, maxplayers: view.maxplayers } : ping;

    const newDay = !moment().utc().isSame(moment(server.online.updated).utc(), 'day');
    if (newDay || !_.isEqual(classToPlain(server.online), { ...server.online, ...online })) {
      var record: number = server.online.record;
      var record_today: number = newDay ? 0 : server.online.record_today;

      if (online.players != null && online.players > server.online.record) {
        record = online.players;
      }

      if (online.players != null && (online.players > record_today || newDay)) {
        record_today = online.players;
      }

      await this.onlineRepository
        .createQueryBuilder()
        .update(Online)
        .set({ ...online, record, record_today })
        .where('server_id = :id', { id: server.id })
        .execute();

      server.online = { ...server.online, ...online, record, record_today, updated: new Date() };

      return {
        instance: server,
        updated: true,
      };
    }

    return {
      instance: server,
      updated: false,
    };
  }
}
