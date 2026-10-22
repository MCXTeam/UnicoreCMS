import { ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { Server } from 'src/game/servers/entities/server.entity';
import { ServersService } from 'src/game/servers/servers.service';
import { In, Repository } from 'typeorm';
import { PlaytimeInput } from './dto/playtime.input';
import { Playtime } from './entities/playtime.entity';
import { ConnectInstance } from '../../connect/entities/connect-instance.entity';
import { ConnectPlaytime } from '../../connect/entities/connect-session.entity';

@Injectable()
export class PlaytimeService {
  constructor(
    @InjectRepository(Playtime)
    private playtimeRepository: Repository<Playtime>,
    private serversService: ServersService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  private async generate(server: Server, user: User, time: number = 0) {
    await this.playtimeRepository.createQueryBuilder().insert().into(Playtime).values({ serverId: server.id, userUuid: user.uuid, time }).orIgnore().execute();
    return this.playtimeRepository.findOneByOrFail({ serverId: server.id, userUuid: user.uuid });
  }

  private summary(row: Playtime, total?: ConnectPlaytime) {
    return Object.assign(row, {
      time: total ? Math.floor((total.baselineMs + total.activeMs) / 60000) : row.time,
      connectedMs: total?.connectedMs ?? null,
      activeMs: total?.activeMs ?? null,
      legacyBaselineMs: total?.baselineMs ?? row.time * 60000,
    });
  }

  async findOneByUser(user: User | string): Promise<Playtime[]> {
    if (typeof user === 'string') {
      user = await this.usersService.getById(user);

      if (!user) throw new NotFoundException();
    }

    const servers = await this.serversService.find();
    const pt = await this.playtimeRepository.findBy({
      user: {
        uuid: user.uuid,
      },
    });

    const totals = await this.playtimeRepository.manager.findBy(ConnectPlaytime, { userUuid: user.uuid });
    return Promise.all(
      servers.map(async (server) => {
        const finder = pt.find((m) => m.server.id == server.id);
        const total = totals.find((row) => row.serverId === server.id);
        const row = finder || await this.generate(server, user as User, total ? Math.floor((total.baselineMs + total.activeMs) / 60000) : 0);
        return this.summary(row, total);
      }),
    );
  }

  async findOneByUserAndServer(server_id: string, user: string | User): Promise<Playtime> {
    if (typeof user === 'string') {
      user = await this.usersService.getById(user);

      if (!user) throw new NotFoundException();
    }

    if (!user) throw new NotFoundException();

    const pt = await this.playtimeRepository.findOne({
      where: {
        user: {
          uuid: user.uuid,
        },
        server: {
          id: server_id,
        },
      },
      relations: ['user', 'server'],
    });

    const total = await this.playtimeRepository.manager.findOneBy(ConnectPlaytime, { serverId: server_id, userUuid: user.uuid });
    if (pt) return this.summary(pt, total);
    else {
      const server = await this.serversService.findOne(server_id);

      if (!server) throw new NotFoundException();

      return this.summary(await this.generate(server, user as User, total ? Math.floor((total.baselineMs + total.activeMs) / 60000) : 0), total);
    }
  }

  async findTopByServer(id: string): Promise<Playtime[]> {
    return this.playtimeRepository.find({
      where: {
        server: { id },
      },
      order: {
        time: 'DESC',
      },
      relations: ['server', 'user'],
      take: 10,
    });
  }

  async update(input: PlaytimeInput[]) {
    if (input.length && await this.playtimeRepository.manager.exists(ConnectInstance, { where: { serverId: In(input.map((row) => row.server)) } })) {
      throw new ConflictException('Server uses Connect v2 sessions; legacy minute writes are disabled');
    }
    const servers = await this.serversService.find();
    const pt = await this.playtimeRepository.find({
      where: { user: { uuid: In(input.map((v) => v.user_uuid)) } },
      relations: ['user'],
    });

    await Promise.all(
      input.map(async (row) => {
        const finder = pt.find((p) => p.server.id == row.server && p.user.uuid == row.user_uuid);
        const server = servers.find((serv) => serv.id == row.server);

        if (server) {
          if (finder) {
            finder.time = finder.time + 1;
            await this.playtimeRepository.save(finder);
          } else {
            const user = await this.usersService.getById(row.user_uuid);

            if (user) {
              await this.generate(server, user, 1);
            }
          }
        }
      }),
    );
  }
}
