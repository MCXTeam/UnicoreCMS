import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as bcrypt from 'bcrypt';
import { User } from 'src/admin/users/entities/user.entity';
import { envConfig } from 'unicore-common';

export default class CreateUsers {
  public async run(dataSource: DataSource): Promise<any> {
    if (envConfig.devseed) {
      const users = await Promise.all(
        _.range(250).map(async () => ({
          email: faker.internet.email(),
          username: faker.internet.userName(),
          password: await bcrypt.hash(faker.internet.password(), 10),
          activated: faker.datatype.boolean(),
        })),
      );

      await dataSource.createQueryBuilder().insert().into(User).values(users).execute();
    }
  }
}
