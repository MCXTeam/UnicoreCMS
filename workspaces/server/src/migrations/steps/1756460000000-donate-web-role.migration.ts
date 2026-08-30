import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLES = ['unicore_donate_groups', 'unicore_donate_permissions'];

export class DonateWebRole1756460000000 implements MigrationInterface {
  name = 'DonateWebRole1756460000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      const t = await queryRunner.getTable(table);

      if (!t || t.findColumnByName('web_role_id')) continue;

      await queryRunner.addColumn(table, new TableColumn({ name: 'web_role_id', type: 'varchar', length: '64', isNullable: true }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      const t = await queryRunner.getTable(table);

      if (!t?.findColumnByName('web_role_id')) continue;

      await queryRunner.dropColumn(table, 'web_role_id');
    }
  }
}
