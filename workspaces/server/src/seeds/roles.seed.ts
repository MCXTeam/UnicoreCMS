import { DataSource } from 'typeorm';
import _ from 'lodash';
import { Role } from 'src/admin/roles/entities/role.entity';

export default class CreateRoles {
  public async run(dataSource: DataSource): Promise<any> {
    await dataSource.getRepository(Role).save([
      {
        id: 'admin',
        name: 'Администратор',
        priority: 10,
        perms: ['admin.*'],
      },
      {
        id: 'editor',
        name: 'Редактор',
        priority: 7,
        perms: ['editor.*'],
      },
    ]);
  }
}
