import { Connection } from 'typeorm';
import { Seeder } from 'typeorm-seeding';
import * as _ from 'lodash';
import { Role } from 'src/admin/roles/entities/role.entity';

export default class CreateRoles implements Seeder {
  public async run(factory: any, connection: Connection): Promise<any> {
    await connection.getRepository(Role).save([
      {
        id: 'admin',
        name: 'Администратор',
        priority: 10,
      },
      {
        id: 'editor',
        name: 'Редактор',
        priority: 7,
      },
    ]);
  }
}
