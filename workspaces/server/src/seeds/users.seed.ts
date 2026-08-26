import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import _ from 'lodash';
import { randomUUID } from 'crypto';
import { User } from 'src/admin/users/entities/user.entity';
import { envConfig } from 'unicore-common';
import { PasswordService } from 'src/auth/password/password.service';
import { passwordAad } from 'src/auth/password/password-aad';

export default class CreateUsers {
  public async run(dataSource: DataSource): Promise<any> {
    if (envConfig.devseed) {
      const passwordService = new PasswordService();

      const users = await Promise.all(
        _.range(250).map(async () => {
          const uuid = randomUUID();

          return {
            uuid,
            email: faker.internet.email(),
            username: faker.internet.userName(),
            password: await passwordService.hash(faker.internet.password(), passwordAad(uuid)),
            activated: faker.datatype.boolean(),
          };
        }),
      );

      await dataSource.createQueryBuilder().insert().into(User).values(users).execute();
    }
  }
}
