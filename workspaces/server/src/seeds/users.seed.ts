import { fakeBoolean, fakeEmail, fakePassword, fakeUsername } from './fake';
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

          const username = fakeUsername();

          return {
            uuid,
            email: fakeEmail(username),
            username,
            password: await passwordService.hash(fakePassword(), passwordAad(uuid)),
            activated: fakeBoolean(),
          };
        }),
      );

      await dataSource.createQueryBuilder().insert().into(User).values(users).execute();
    }
  }
}
