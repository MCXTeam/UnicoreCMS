import { DataSource, QueryRunner } from 'typeorm';
import { envConfig } from 'unicore-common';
import { formatError, stderr, stdout } from '@common';
import { SCHEMA_LOCK_ATTEMPTS, SCHEMA_LOCK_NAME, SCHEMA_LOCK_TIMEOUT } from '../common/constants';
import { ormconfig } from '../ormconfig';

interface AlignResult {
  applied: number;
  attention: string[];
  failed: string[];
}

interface ColumnShape {
  type: string;
  length?: string;
  precision?: number | null;
  scale?: number | null;
}

const CHANGE_COLUMN =
  /^\s*ALTER TABLE\s+[`"]?([^`"\s]+)[`"]?\s+(?:CHANGE|MODIFY)(?:\s+COLUMN)?\s+[`"]?([^`"\s]+)[`"]?\s+(?:[`"]?([^`"\s]+)[`"]?\s+)?(.+)$/i;

const tableName = (query: string): string => query.match(/(?:CREATE TABLE|ALTER TABLE)\s+[`"]?([^`"\s(]+)/i)?.[1] || '';

const isCreateTable = (query: string): boolean => /^\s*CREATE TABLE/i.test(query);

const isCreateIndex = (query: string): boolean => /^\s*CREATE (UNIQUE )?INDEX/i.test(query);

const isAddColumn = (query: string): boolean => /^\s*ALTER TABLE\s+[`"]?[^`"\s]+[`"]?\s+ADD\s+(?!CONSTRAINT)/i.test(query);

const isForeignKey = (query: string): boolean => /FOREIGN KEY/i.test(query);

const columnShape = (column: ColumnShape): string => {
  if (column.precision !== null && column.precision !== undefined) return `${column.type}(${column.precision},${column.scale ?? 0})`;

  return column.length ? `${column.type}(${column.length})` : String(column.type);
};

async function isCosmetic(runner: QueryRunner, query: string): Promise<boolean> {
  const parts = query.match(CHANGE_COLUMN);

  if (!parts) return false;

  const [, table, from, to, definition] = parts;

  if (to && to !== from) return false;

  const column = (await runner.getTable(table))?.findColumnByName(from);

  if (!column) return false;

  return definition.trim().toLowerCase().startsWith(columnShape(column).toLowerCase());
}

async function acquireLock(runner: QueryRunner): Promise<void> {
  const type = runner.connection.options.type;

  if (type === 'postgres') {
    await runner.query('SELECT pg_advisory_lock(hashtext($1))', [SCHEMA_LOCK_NAME]);
    return;
  }

  if (type !== 'mysql' && type !== 'mariadb') return;

  for (let attempt = 1; attempt <= SCHEMA_LOCK_ATTEMPTS; attempt++) {
    const [row] = await runner.query('SELECT GET_LOCK(?, ?) AS acquired', [SCHEMA_LOCK_NAME, SCHEMA_LOCK_TIMEOUT]);

    if (Number(row?.acquired) === 1) return;

    stdout(`Схему обновляет другой процесс, ждём (попытка ${attempt} из ${SCHEMA_LOCK_ATTEMPTS})`);
  }

  throw new Error('Не удалось получить блокировку схемы: её дольше положенного держит другой процесс');
}

async function releaseLock(runner: QueryRunner): Promise<void> {
  const type = runner.connection.options.type;

  try {
    if (type === 'postgres') await runner.query('SELECT pg_advisory_unlock(hashtext($1))', [SCHEMA_LOCK_NAME]);
    else if (type === 'mysql' || type === 'mariadb') await runner.query('SELECT RELEASE_LOCK(?)', [SCHEMA_LOCK_NAME]);
  } catch {}
}

export async function alignSchema(dataSource: DataSource, runner: QueryRunner): Promise<AlignResult> {
  const { upQueries } = await dataSource.driver.createSchemaBuilder().log();
  const result: AlignResult = { applied: 0, attention: [], failed: [] };
  const created = new Set<string>();

  for (const query of upQueries) {
    const table = tableName(query.query);
    const creates = isCreateTable(query.query);
    const allowed = creates || isCreateIndex(query.query) || isAddColumn(query.query) || (isForeignKey(query.query) && created.has(table));

    if (!allowed) {
      const cosmetic = isForeignKey(query.query) || (await isCosmetic(runner, query.query));

      if (!cosmetic) result.attention.push(query.query);

      continue;
    }

    try {
      await runner.query(query.query, query.parameters);

      if (creates) created.add(table);

      result.applied++;
    } catch (error) {
      result.failed.push(`${query.query} — ${formatError(error)}`);
    }
  }

  return result;
}

export async function applySchema(): Promise<void> {
  if (envConfig.migrationsSkip) {
    stdout('MIGRATIONS_SKIP=true: схема не проверяется, обновления базы не применяются');
    return;
  }

  const dataSource = new DataSource({ ...ormconfig, synchronize: false });

  await dataSource.initialize();

  const runner = dataSource.createQueryRunner();

  try {
    await acquireLock(runner);

    const applied = await dataSource.runMigrations({ transaction: 'each' });

    for (const migration of applied) stdout(`Применено обновление базы: ${migration.name}`);

    const align = await alignSchema(dataSource, runner);

    if (align.applied) stdout(`Схема дополнена: ${align.applied} ${align.applied === 1 ? 'запрос' : 'запросов'}`);

    if (align.attention.length)
      stdout(
        `Схема расходится с кодом ещё в ${align.attention.length} местах, эти изменения небезопасны и пропущены: pnpm run schema:align`,
      );

    for (const failure of align.failed) stderr(`Не удалось применить: ${failure}`);
  } catch (error) {
    stderr('Обновление базы не выполнено, сервер остановлен');
    stderr(formatError(error));
    process.exit(1);
  } finally {
    await releaseLock(runner);
    await runner.release();
    await dataSource.destroy();
  }
}

export async function schemaStatus(): Promise<void> {
  const dataSource = new DataSource({ ...ormconfig, synchronize: false });

  await dataSource.initialize();

  try {
    const pending = await dataSource.showMigrations();
    const executed: { name: string }[] = await dataSource.query(`SELECT name FROM ${dataSource.options.migrationsTableName} ORDER BY id`);

    stdout(`Применено обновлений: ${executed.length}`);

    for (const row of executed) stdout(`  ${row.name}`);

    stdout(pending ? 'Есть неприменённые обновления, они накатятся при следующем старте' : 'Неприменённых обновлений нет');
  } finally {
    await dataSource.destroy();
  }
}

export async function runAlign(): Promise<void> {
  const dataSource = new DataSource({ ...ormconfig, synchronize: false });

  await dataSource.initialize();

  const runner = dataSource.createQueryRunner();

  try {
    const align = await alignSchema(dataSource, runner);

    stdout(`Схема дополнена: ${align.applied}`);

    for (const query of align.attention) stdout(`Пропущено как небезопасное: ${query}`);
    for (const failure of align.failed) stderr(`Не удалось применить: ${failure}`);
  } finally {
    await runner.release();
    await dataSource.destroy();
  }
}
