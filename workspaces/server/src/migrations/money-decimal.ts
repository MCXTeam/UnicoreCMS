import { DataSource } from 'typeorm';
import { formatError, MONEY_COLUMNS, MONEY_PRECISION, MONEY_SCALE, stderr, stdout } from '@common';
import { ormconfig } from '../ormconfig';

interface ColumnInfo {
  type: string;
  nullable: string;
  default: string | null;
}

async function run() {
  const dataSource = new DataSource({ ...ormconfig, entities: [], synchronize: false, migrations: [] });

  await dataSource.initialize();

  let converted = 0;

  try {
    for (const { table, column } of MONEY_COLUMNS) {
      const [current]: ColumnInfo[] = await dataSource.query(
        `SELECT DATA_TYPE AS type, IS_NULLABLE AS nullable, COLUMN_DEFAULT AS \`default\`
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column],
      );

      if (!current || String(current.type).toLowerCase() === 'decimal') continue;

      const nullable = current.nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const parsed = current.default === null ? NaN : Number(current.default);
      const defaults = Number.isFinite(parsed) ? ` DEFAULT ${parsed}` : current.nullable === 'YES' ? '' : ' DEFAULT 0';

      await dataSource.query(
        `ALTER TABLE \`${table}\` MODIFY \`${column}\` DECIMAL(${MONEY_PRECISION}, ${MONEY_SCALE}) ${nullable}${defaults}`,
      );

      converted++;
      stdout(`${table}.${column}: float -> decimal(${MONEY_PRECISION},${MONEY_SCALE})`);
    }
  } finally {
    await dataSource.destroy();
  }

  if (converted) stdout(`Денежные колонки переведены в decimal: ${converted}`);
}

run().catch((error) => {
  stderr(formatError(error));
  process.exit(1);
});
