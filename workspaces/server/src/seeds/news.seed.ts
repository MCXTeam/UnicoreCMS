import { fakeText } from './fake';
import { News } from 'src/admin/news/entities/news.entity';
import { DataSource } from 'typeorm';
import _ from 'lodash';

export default class CreateNews {
  public async run(dataSource: DataSource): Promise<any> {
    const news = _.range(20).map(() => ({
      title: fakeText().slice(0, 60) + '...',
      description: fakeText(),
    }));

    await dataSource.createQueryBuilder().insert().into(News).values(news).execute();
  }
}
