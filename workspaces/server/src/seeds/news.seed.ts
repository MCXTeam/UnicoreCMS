import { faker } from '@faker-js/faker';
import { News } from 'src/admin/news/entities/news.entity';
import { DataSource } from 'typeorm';
import _ from 'lodash';

export default class CreateNews {
  public async run(dataSource: DataSource): Promise<any> {
    const news = _.range(20).map(() => ({
      title: faker.lorem.text().slice(0, 60) + '...',
      description: faker.lorem.text(),
    }));

    await dataSource.createQueryBuilder().insert().into(News).values(news).execute();
  }
}
