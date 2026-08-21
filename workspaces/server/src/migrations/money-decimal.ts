import { DataSource } from 'typeorm';
import { formatError, MONEY_PRECISION, MONEY_SCALE, stderr, stdout } from '@common';
import { ormconfig } from '../ormconfig';

interface ColumnInfo {
  type: string;
  nullable: string;
  default: string | null;
}

interface DecimalColumn {
  table: string;
  column: string;
  precision: number;
  scale: number;
}

const decimalColumns = (dataSource: DataSource): DecimalColumn[] =>
  dataSource.entityMetadatas.flatMap((meta) =>
    meta.columns
      .filter((column) => String(column.type) === 'decimal')
      .map((column) => ({
        table: meta.tableName,
        column: column.databaseName,
        precision: column.precision ?? MONEY_PRECISION,
        scale: column.scale ?? MONEY_SCALE,
      })),
  );

async function run() {
  const dataSource = new DataSource({ ...ormconfig, synchronize: false, migrations: [] });

  await dataSource.initialize();

  let converted = 0;

  try {
    for (const { table, column, precision, scale } of decimalColumns(dataSource)) {
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

      await dataSource.query(`ALTER TABLE \`${table}\` MODIFY \`${column}\` DECIMAL(${precision}, ${scale}) ${nullable}${defaults}`);

      converted++;
      stdout(`${table}.${column}: ${current.type} -> decimal(${precision},${scale})`);
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
