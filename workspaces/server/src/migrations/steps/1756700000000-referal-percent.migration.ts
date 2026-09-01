import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLES = ['unicore_roles', 'unicore_donate_groups', 'unicore_donate_permissions'];

export class ReferalPercent1756700000000 implements MigrationInterface {
  name = 'ReferalPercent1756700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      const t = await queryRunner.getTable(table);

      if (!t || t.findColumnByName('referal_percent')) continue;

      await queryRunner.addColumn(table, new TableColumn({ name: 'referal_percent', type: 'int', isNullable: true }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      const t = await queryRunner.getTable(table);

      if (!t?.findColumnByName('referal_percent')) continue;

      await queryRunner.dropColumn(table, 'referal_percent');
    }
  }
}
