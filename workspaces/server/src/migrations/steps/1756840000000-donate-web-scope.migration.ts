import { Permission, satisfiesPermission } from 'unicore-common';
import { MigrationInterface, QueryRunner } from 'typeorm';

const COLUMNS: [table: string, column: string, key: string][] = [
  ['unicore_roles', 'perms', 'id'],
  ['unicore_users', 'perms', 'uuid'],
];

const GRANTED: Permission = 'panel.donate.permissions.web';

const IMPLIED: Permission[] = ['panel.donate.permissions.create', 'panel.donate.permissions.update'];

export class DonateWebScope1756840000000 implements MigrationInterface {
  name = 'DonateWebScope1756840000000';

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

        if (satisfiesPermission(perms, GRANTED)) continue;
        if (!IMPLIED.some((permission) => satisfiesPermission(perms, permission))) continue;

        await queryRunner.query(`UPDATE \`${name}\` SET \`${column}\` = ? WHERE \`${key}\` = ?`, [
          [...perms, GRANTED].join(','),
          row.row_key,
        ]);
      }
    }
  }

  public async down(): Promise<void> {
    return;
  }
}
