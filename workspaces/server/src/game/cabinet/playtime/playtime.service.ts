import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { Server } from 'src/game/servers/entities/server.entity';
import { ServersService } from 'src/game/servers/servers.service';
import { In, Repository } from 'typeorm';
import { PlaytimeInput } from './dto/playtime.input';
import { Playtime } from './entities/playtime.entity';

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
    const pt = new Playtime();

    pt.server = server;
    pt.user = user;
    pt.time = time;

    return await this.playtimeRepository.save(pt);
  }

  async findOneByUser(user: User | string): Promise<Playtime[]> {
    if (typeof user === 'string') {
      user = await this.usersService.getById(user);

      if (!user) throw new NotFoundException();
    }

    const servers = await this.serversService.find();
    const pt = await this.playtimeRepository.find({
      user: {
        uuid: user.uuid,
      },
    });

    return Promise.all(
      servers.map(async (server) => {
        const finder = pt.find((m) => m.server.id == server.id);
        if (finder) return finder;
        else return await this.generate(server, user as User);
      }),
    );
  }

  async findOneByUserAndServer(server_id: string, user: string | User): Promise<Playtime> {
    if (typeof user === 'string') {
      user = await this.usersService.getById(user);

      if (!user) throw new NotFoundException();
    }

    if (!user) throw new NotFoundException();

    const pt = await this.playtimeRepository.findOne(
      {
        user: {
          uuid: user.uuid,
        },
        server: {
          id: server_id,
        },
      },
      { relations: ['user', 'server'] },
    );

    if (pt) return pt;
    else {
      const server = await this.serversService.findOne(server_id);

      if (!server) throw new NotFoundException();

      return this.generate(server, user as User);
    }
  }

  async update(input: PlaytimeInput[]) {
    const servers = await this.serversService.find();
    const pt = await this.playtimeRepository.find({
      where: { user: { uuid: In(input.map((v) => v.user_uuid)) } },
      relations: ['user'],
    });

    await Promise.all(
      input.map(async (row) => {
        const finder = pt.find((p) => p.server.id == row.server_id && p.user.uuid == row.user_uuid);
        const server = servers.find((serv) => serv.id == row.server_id);

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
