import { MigrationInterface, QueryRunner } from 'typeorm';

const SOURCE = 'panel.users.money';
const ADDED = ['panel.users.balance.real', 'panel.users.balance.bonus'];

const COLUMNS: [table: string, key: string][] = [
  ['unicore_roles', 'id'],
  ['unicore_users', 'uuid'],
];

export class BalancePermissions1756210000000 implements MigrationInterface {
  name = 'BalancePermissions1756210000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, key] of COLUMNS) {
      const table = await queryRunner.getTable(name);

      if (!table?.findColumnByName('perms')) continue;

      const rows: Record<string, any>[] = await queryRunner.query(
        `SELECT \`${key}\` AS row_key, \`perms\` AS value FROM \`${name}\` WHERE FIND_IN_SET(?, \`perms\`)`,
        [SOURCE],
      );

      for (const row of rows) {
        const perms = String(row.value)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        const missing = ADDED.filter((permission) => !perms.includes(permission));

        if (!missing.length) continue;

        await queryRunner.query(`UPDATE \`${name}\` SET \`perms\` = ? WHERE \`${key}\` = ?`, [
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
