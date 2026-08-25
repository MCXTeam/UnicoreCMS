import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE = 'unicore_servers';

export class ServerWipe1756170000000 implements MigrationInterface {
  name = 'ServerWipe1756170000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);

    if (!table || table.findColumnByName('wipe')) return;

    await queryRunner.addColumn(table, new TableColumn({ name: 'wipe', type: 'boolean', isNullable: false, default: false }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);

    if (!table?.findColumnByName('wipe')) return;

    await queryRunner.dropColumn(table, 'wipe');
  }
}
