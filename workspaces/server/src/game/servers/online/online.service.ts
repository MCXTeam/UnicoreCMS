import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Online } from './entities/online.entity';
import * as _ from 'lodash';
import { pingMinecraft } from './minecraft-ping';
import { Server } from '../entities/server.entity';
import { ServerInstance } from '../entities/server-instance.entity';
import * as moment from 'moment';
import { UpdateOnline } from './interfaces/update-online.interface';
import { Onlines } from './dto/onlines.dto';
import { OnlinesRecord } from './entities/onlines-record.entity';
import { OnlinesAbsoluteRecord } from './entities/onlines-absolute-record.entity';
import { RecordOnlineInterface } from './interfaces/record-online.interface';
import { classToPlain } from 'class-transformer';
import { DEFAULT_MINECRAFT_PORT, PING_TIMEOUT_MS } from '@common';

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
  ) {}

  async find(): Promise<Onlines> {
    const servers = _.orderBy(
      await this.onlineRepository.find({
        relations: ['server', 'server.instances'],
      }),
      ['server.priority'],
      ['asc'],
    );
    const record = await this.onlinesRecordsRepository.findOne({
      order: { created: 'DESC' },
      where: { created: MoreThanOrEqual(moment().startOf('day').toDate()) },
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
        online: _(servers)
          .map((serv) => serv.players)
          .sum(),
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
    let today: RecordOnlineInterface;
    let absolute: RecordOnlineInterface;

    const id = (
      await this.onlinesRecordsRepository.findOne({
        order: { created: 'DESC' },
        where: { created: MoreThanOrEqual(moment().startOf('day').toDate()) },
      })
    )?.id;

    if (onlines.total.online > onlines.total.records.absolute.online) {
      const entity = await this.onlinesAbsoluteRecordsRepository.save({
        online: onlines.total.online,
      });
      absolute = { online: entity.online, created: entity.created };
    }

    if (onlines.total.online > onlines.total.records.today.online) {
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

  async updateOnline(server: Server): Promise<UpdateOnline> {
    const hasInstances = Boolean(server.instances?.length);

    if (!server.online || (!hasInstances && !server.query?.host)) {
      return {
        instance: server,
        updated: false,
      };
    }

    const online = hasInstances ? await this.updateInstances(server) : await this.ping(server.query.host, server.query.port);

    if (!_.isEqual(classToPlain(server.online), { ...server.online, ...online })) {
      var record: number = server.online.record;
      var record_today: number = server.online.record_today;

      if (online.players > server.online.record) {
        record = online.players;
      }

      if (online.players > server.online.record_today || !moment().utc().isSame(moment(server.online.updated).utc(), 'd')) {
        record_today = online.players;
      }

      await this.onlineRepository
        .createQueryBuilder()
        .update(Online)
        .set({ ...online, record, record_today })
        .where('server_id = :id', { id: server.id })
        .execute();

      server.online = { ...server.online, ...online };

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
