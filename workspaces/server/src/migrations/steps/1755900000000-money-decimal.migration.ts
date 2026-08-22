import { MigrationInterface, QueryRunner } from 'typeorm';
import { MONEY_PRECISION, MONEY_SCALE } from '@common';

export class MoneyDecimal1755900000000 implements MigrationInterface {
  name = 'MoneyDecimal1755900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const meta of queryRunner.connection.entityMetadatas) {
      const declared = meta.columns.filter((column) => String(column.type) === 'decimal');

      if (!declared.length) continue;

      const table = await queryRunner.getTable(meta.tableName);

      if (!table) continue;

      for (const column of declared) {
        const current = table.findColumnByName(column.databaseName);

        if (!current || String(current.type).toLowerCase() === 'decimal') continue;

        const changed = current.clone();

        changed.type = 'decimal';
        changed.precision = column.precision ?? MONEY_PRECISION;
        changed.scale = column.scale ?? MONEY_SCALE;

        await queryRunner.changeColumn(table, current, changed);
      }
    }
  }

  public async down(): Promise<void> {}
}
