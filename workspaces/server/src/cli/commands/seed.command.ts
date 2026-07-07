import { Command, CommandRunner } from 'nest-commander';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as clc from 'cli-color';
import CreateRoles from '../../seeds/roles.seed';
import CreateServers from '../../seeds/servers.seed';
import CreateBonuses from '../../seeds/bonuses.seed';
import CreateVoteGifts from '../../seeds/votes-gifts.seed';
import CreateNews from '../../seeds/news.seed';
import CreateUsers from '../../seeds/users.seed';

@Command({ name: 'seed', description: 'Run database seeders' })
export class SeedCommand extends CommandRunner {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super();
  }

  async run(): Promise<void> {
    const seeders = [CreateRoles, CreateServers, CreateBonuses, CreateVoteGifts, CreateNews, CreateUsers];

    for (const S of seeders) {
      console.log(clc.magenta('Seeding: ' + S.name));
      await new S().run(this.dataSource);
    }

    console.log(clc.green('Seeding done'));
  }
}
