import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';
import ru from '../../seeds/locales/ru.json';
import en from '../../seeds/locales/en.json';

export class WebRoleOrigins1757080000000 implements MigrationInterface {
  name = 'WebRoleOrigins1757080000000';

  async up(runner: QueryRunner): Promise<void> {
    if (!(await runner.hasTable('unicore_users')) || !(await runner.hasTable('unicore_roles'))) return;

    const columns: TableColumn[] = [];

    for (const [name, table, reference] of [['user_uuid', 'unicore_users', 'uuid'], ['role_id', 'unicore_roles', 'id']]) {
      const [shape] = await runner.query(`SELECT DATA_TYPE AS type,CHARACTER_MAXIMUM_LENGTH AS size,CHARACTER_SET_NAME AS charset,COLLATION_NAME AS collation
        FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?`, [table, reference]);

      if (!shape || !['varchar', 'char'].includes(shape.type)) throw new Error('Unsupported role identifier column');
      columns.push(new TableColumn({ name, type: 'varchar', length: '255', charset: shape.charset, collation: shape.collation, isPrimary: true }));
    }
    if (!(await runner.hasTable('unicore_web_role_origins')))
      await runner.createTable(new Table({
        name: 'unicore_web_role_origins',
        columns: [
          ...columns,
          { name: 'manual', type: 'tinyint', default: 0 },
          { name: 'legacy', type: 'tinyint', default: 0 },
        ],
      }));

    const origins = await runner.getTable('unicore_web_role_origins');

    for (const column of columns) {
      const [current] = await runner.query(`SELECT DATA_TYPE AS type,CHARACTER_MAXIMUM_LENGTH AS size,CHARACTER_SET_NAME AS charset,COLLATION_NAME AS collation
        FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='unicore_web_role_origins' AND COLUMN_NAME=?`, [column.name]);

      if (current.type === column.type && String(current.size) === column.length && current.charset === column.charset && current.collation === column.collation) continue;
      if (!/^[a-z0-9_]+$/i.test(column.charset) || !/^[a-z0-9_]+$/i.test(column.collation)) throw new Error('Invalid role identifier collation');
      await runner.query(`ALTER TABLE unicore_web_role_origins MODIFY COLUMN \`${column.name}\` ${column.type}(${Number(column.length)}) CHARACTER SET ${column.charset} COLLATE ${column.collation} NOT NULL`);
    }

    for (const [column, table, referenced] of [['user_uuid', 'unicore_users', 'uuid'], ['role_id', 'unicore_roles', 'id']])
      if (!origins.foreignKeys.some((key) => key.columnNames.length === 1 && key.columnNames[0] === column))
        await runner.createForeignKey(origins, new TableForeignKey({ columnNames: [column], referencedTableName: table, referencedColumnNames: [referenced], onDelete: 'CASCADE' }));

    for (const [table, relation, parent] of [
      ['unicore_users_donate_groups', 'group_id', 'unicore_donate_groups'],
      ['unicore_users_donate_permissions', 'permission_id', 'unicore_donate_permissions'],
    ]) {
      if (!(await runner.hasTable(table)) || !(await runner.hasTable(parent)) || !(await runner.hasTable('unicore_users_roles'))) continue;

      const definition = await runner.getTable(parent);

      if (!definition.findColumnByName('purchasable'))
        await runner.addColumn(parent, new TableColumn({ name: 'purchasable', type: 'tinyint', default: 1 }));

      await runner.query(`INSERT IGNORE INTO unicore_web_role_origins (user_uuid,role_id,manual,legacy)
        SELECT DISTINCT granted.user_uuid,definition.web_role_id,1,1 FROM \`${table}\` granted
        INNER JOIN \`${parent}\` definition ON definition.id=granted.\`${relation}\`
        INNER JOIN unicore_users_roles assigned ON assigned.user_uuid=granted.user_uuid AND assigned.role_id=definition.web_role_id
        INNER JOIN unicore_roles role ON role.id=definition.web_role_id
        WHERE definition.web_role_id IS NOT NULL`);
    }

    if (await runner.hasTable('unicore_translations') && await runner.hasTable('unicore_locales'))
      for (const [locale, messages] of Object.entries({ ru, en }))
        for (const key of ['admin.manual_roles', 'admin.donate_roles', 'admin.donate_roles_hint', 'admin.legacy_roles_hint', 'admin.donate_purchasable', 'admin.donate_manual_only'])
          await runner.query('INSERT IGNORE INTO `unicore_translations` (`locale_code`,`translation_key`,`value`) SELECT `code`,?,? FROM `unicore_locales` WHERE `code`=?', [key, messages[key], locale]);
  }

  async down(): Promise<void> {}
}
