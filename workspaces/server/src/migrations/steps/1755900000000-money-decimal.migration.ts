import { MigrationInterface, QueryRunner } from 'typeorm';
import { MONEY_PRECISION, MONEY_SCALE } from '@common';

export class MoneyDecimal1755900000000 implements MigrationInterface {
  name = 'MoneyDecimal1755900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { driver, options } = queryRunner.connection;

    if (options.type !== 'mysql' && options.type !== 'mariadb') {
      throw new Error(`Money decimal migration does not support ${options.type}`);
    }

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
        changed.length = '';
        changed.width = undefined;

        if (current.asExpression || current.isGenerated) {
          throw new Error(`Cannot convert generated money column ${table.name}.${current.name}`);
        }

        const tableName = table.name.split('.').map((part) => driver.escape(part)).join('.');
        const definition = [
          driver.escape(changed.name),
          driver.createFullType(changed),
          changed.unsigned || changed.zerofill ? 'UNSIGNED' : '',
          changed.zerofill ? 'ZEROFILL' : '',
          changed.isNullable ? 'NULL' : 'NOT NULL',
          changed.default !== undefined ? `DEFAULT ${changed.default}` : '',
          'COMMENT ?',
        ].filter(Boolean).join(' ');

        await queryRunner.query(`ALTER TABLE ${tableName} MODIFY COLUMN ${definition}`, [changed.comment || '']);
        Object.assign(current, changed);
      }
    }
  }

  public async down(): Promise<void> {}
}
