import faker from '@faker-js/faker';
import { News } from 'src/admin/news/entities/news.entity';
import { Connection } from 'typeorm';
import { Seeder } from 'typeorm-seeding';
import * as _ from 'lodash';

export default class CreateNews implements Seeder {
  public async run(factory: any, connection: Connection): Promise<any> {
    const news = _.range(25).map(() => ({
      title: faker.lorem.text().slice(0, 60) + '...',
      description: faker.lorem.text(),
    }));

    await connection.createQueryBuilder().insert().into(News).values(news).execute();
  }
}
