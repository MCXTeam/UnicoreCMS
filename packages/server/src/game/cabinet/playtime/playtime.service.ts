import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { Server } from 'src/game/servers/entities/server.entity';
import { ServersService } from 'src/game/servers/servers.service';
import { Repository } from 'typeorm';
import { Playtime } from './entities/playtime.entity';

@Injectable()
export class PlaytimeService {
  constructor(
    @InjectRepository(Playtime)
    private playtimeRepository: Repository<Playtime>,
    private serversService: ServersService,
    private usersService: UsersService
  ) { }

  private async generate(server: Server, user: User) {
    const pt = new Playtime()

    pt.server = server
    pt.user = user

    return await this.playtimeRepository.save(pt)
  }

  async findOneByUser(user: User | string): Promise<Playtime[]> {
    if (typeof user === 'string') {
      user = await this.usersService.getById(user)

      if (!user)
        throw new NotFoundException()
    }

    const servers = await this.serversService.find()
    const pt = await this.playtimeRepository.find({
      user: {
        uuid: user.uuid
      }
    })

    return Promise.all(servers.map(async server => {
      const finder = pt.find(m => m.server.id == server.id)
      if (finder) return finder
      else return await this.generate(server, user as User)
    }))
  }
}
