import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLES = ['unicore_donate_groups', 'unicore_donate_permissions', 'unicore_products', 'unicore_kits'];

export class Giftable1756150000000 implements MigrationInterface {
  name = 'Giftable1756150000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const name of TABLES) {
      const table = await queryRunner.getTable(name);

      if (!table || table.findColumnByName('giftable')) continue;

      await queryRunner.addColumn(table, new TableColumn({ name: 'giftable', type: 'boolean', isNullable: false, default: true }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of TABLES) {
      const table = await queryRunner.getTable(name);

      if (!table?.findColumnByName('giftable')) continue;

      await queryRunner.dropColumn(table, 'giftable');
    }
  }
}
