import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import clc from 'cli-color';
import CreateRoles from '../../seeds/roles.seed';
import CreateServers from '../../seeds/servers.seed';
import CreateBonuses from '../../seeds/bonuses.seed';
import CreateVoteGifts from '../../seeds/votes-gifts.seed';
import CreateNews from '../../seeds/news.seed';
import CreateUsers from '../../seeds/users.seed';
import { CommandDefinition } from '../command';
import { stdout } from '../stdout';

@Injectable()
export class SeedCommand implements CommandDefinition {
  readonly name = 'seed';
  readonly description = 'Run database seeders';

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async run(): Promise<void> {
    const seeders = [CreateRoles, CreateServers, CreateBonuses, CreateVoteGifts, CreateNews, CreateUsers];

    for (const S of seeders) {
      stdout(clc.magenta('Seeding: ' + S.name));
      await new S().run(this.dataSource);
    }

    stdout(clc.green('Seeding done'));
  }
}
