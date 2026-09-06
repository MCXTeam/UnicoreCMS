import { Permission, satisfiesPermission } from 'unicore-common';
import { MigrationInterface, QueryRunner } from 'typeorm';

const COLUMNS: [table: string, column: string, key: string][] = [
  ['unicore_roles', 'perms', 'id'],
  ['unicore_users', 'perms', 'uuid'],
];

const GRANTED: Permission[] = ['panel.layout.read', 'panel.layout.update'];

const IMPLIED: Permission = 'panel.config.update';

export class LayoutPermissions1756870000000 implements MigrationInterface {
  name = 'LayoutPermissions1756870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, column, key] of COLUMNS) {
      const table = await queryRunner.getTable(name);

      if (!table?.findColumnByName(column)) continue;

      const rows: Record<string, any>[] = await queryRunner.query(
        `SELECT \`${key}\` AS row_key, \`${column}\` AS value FROM \`${name}\` WHERE \`${column}\` IS NOT NULL AND \`${column}\` <> ''`,
      );

      for (const row of rows) {
        const perms = String(row.value)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

        if (!satisfiesPermission(perms, IMPLIED)) continue;

        const missing = GRANTED.filter((permission) => !satisfiesPermission(perms, permission));

        if (!missing.length) continue;

        await queryRunner.query(`UPDATE \`${name}\` SET \`${column}\` = ? WHERE \`${key}\` = ?`, [
          [...perms, ...missing].join(','),
          row.row_key,
        ]);
      }
    }
  }

  public async down(): Promise<void> {
    return;
  }
}
