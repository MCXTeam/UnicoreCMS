import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLES = ['unicore_donate_groups', 'unicore_donate_permissions'];

export class Regiftable1756710000000 implements MigrationInterface {
  name = 'Regiftable1756710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const name of TABLES) {
      const table = await queryRunner.getTable(name);

      if (!table || table.findColumnByName('regiftable')) continue;

      await queryRunner.addColumn(name, new TableColumn({ name: 'regiftable', type: 'boolean', isNullable: false, default: true }));
    }

    const gifts = await queryRunner.getTable('unicore_gifts');

    if (gifts && !gifts.findColumnByName('until'))
      await queryRunner.addColumn('unicore_gifts', new TableColumn({ name: 'until', type: 'datetime', isNullable: true }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of TABLES) {
      const table = await queryRunner.getTable(name);

      if (!table?.findColumnByName('regiftable')) continue;

      await queryRunner.dropColumn(name, 'regiftable');
    }

    const gifts = await queryRunner.getTable('unicore_gifts');

    if (gifts?.findColumnByName('until')) await queryRunner.dropColumn('unicore_gifts', 'until');
  }
}
