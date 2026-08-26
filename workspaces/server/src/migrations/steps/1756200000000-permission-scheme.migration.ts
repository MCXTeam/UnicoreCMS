import { migratePermissions } from 'unicore-common';
import { MigrationInterface, QueryRunner } from 'typeorm';

const COLUMNS: [table: string, column: string, key: string][] = [
  ['unicore_roles', 'perms', 'id'],
  ['unicore_users', 'perms', 'uuid'],
  ['unicore_donate_groups', 'web_perms', 'id'],
  ['unicore_donate_permissions', 'web_perms', 'id'],
];

export class PermissionScheme1756200000000 implements MigrationInterface {
  name = 'PermissionScheme1756200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, column, key] of COLUMNS) {
      const table = await queryRunner.getTable(name);

      if (!table?.findColumnByName(column)) continue;

      const rows: Record<string, any>[] = await queryRunner.query(
        `SELECT \`${key}\` AS row_key, \`${column}\` AS value FROM \`${name}\` WHERE \`${column}\` IS NOT NULL AND \`${column}\` <> ''`,
      );

      for (const row of rows) {
        const before = String(row.value)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        const after = migratePermissions(before);

        if (before.join(',') === after.join(',')) continue;

        await queryRunner.query(`UPDATE \`${name}\` SET \`${column}\` = ? WHERE \`${key}\` = ?`, [after.join(','), row.row_key]);
      }
    }
  }

  public async down(): Promise<void> {
    return;
  }
}
