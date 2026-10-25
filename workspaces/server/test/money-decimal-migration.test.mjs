import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { DataSource, EntitySchema } from 'typeorm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../src');

function loadMigration() {
  const constants = readFileSync(resolve(sourceRoot, 'common/constants.ts'), 'utf8');
  const moneyConstants = Object.fromEntries(['MONEY_PRECISION', 'MONEY_SCALE'].map((name) => [name, Number(constants.match(new RegExp(`export const ${name} = (\\d+)`))[1])]));
  const source = readFileSync(resolve(sourceRoot, 'migrations/steps/1755900000000-money-decimal.migration.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText;
  const exports = {};

  runInNewContext(compiled, { exports, require: (name) => name === '@common' ? moneyConstants : require(name) });

  return exports.MoneyDecimal1755900000000;
}

it('money migration preserves balances, nullable amounts, defaults and indexes in MariaDB', { skip: process.env.MONEY_MIGRATION_TEST !== '1' }, async () => {
  const options = { ...JSON.parse(process.env.MONEY_MIGRATION_DB_CONFIG), type: 'mariadb', connectTimeout: 5000 };
  delete options.database;
  const database = `money_migration_test_${process.pid}_${Date.now()}`;
  assert.match(database, /^money_migration_test_\d+_\d+$/);
  const admin = await new DataSource(options).initialize();
  let connection;
  let runner;

  try {
    await admin.query(`CREATE DATABASE \`${database}\``);
    const columns = {
      id: { type: Number, primary: true },
      real: { type: 'decimal', precision: 16, scale: 4, default: 0 },
      virtual: { type: 'decimal', precision: 16, scale: 4, default: 0 },
      amount: { type: 'decimal', precision: 16, scale: 4, nullable: true },
      unsigned_amount: { type: 'decimal', precision: 16, scale: 4, unsigned: true, default: 7 },
      unchanged: { type: 'decimal', precision: 16, scale: 4 },
      label: { type: String },
    };
    const queries = [];
    const logger = { logQuery(query) { if (query.startsWith('ALTER TABLE')) queries.push(query); }, logQueryError() {}, logQuerySlow() {}, logSchemaBuild() {}, logMigration() {}, log() {} };
    connection = await new DataSource({ ...options, database, entities: [new EntitySchema({ name: 'MoneyProbe', tableName: 'order', columns })], logging: ['query'], logger }).initialize();
    await connection.query("CREATE TABLE `order` (`id` int PRIMARY KEY, `real` float NOT NULL DEFAULT 0 COMMENT 'balance', `virtual` float NOT NULL DEFAULT 0, `amount` double NULL DEFAULT NULL, `unsigned_amount` int UNSIGNED NOT NULL DEFAULT 7, `unchanged` decimal(16,4) NOT NULL, `label` varchar(32) NOT NULL, INDEX `amount_index` (`amount`))");
    await connection.query("INSERT INTO `order` VALUES (1,7700,25,12.125,9,1.125,'first'),(2,13076,0,NULL,7,2,'second'),(3,-12.25,0,-9.5,8,3,'negative')");
    const rows = () => connection.query('SELECT * FROM `order` ORDER BY id');
    const normalize = (values) => values.map((row) => Object.fromEntries(Object.entries(row).map(([name, value]) => [name, name === 'label' || value === null ? value : Number(value)])));
    const before = normalize(await rows());
    runner = connection.createQueryRunner();
    const Migration = loadMigration();
    await new Migration().up(runner);

    assert.deepEqual(normalize(await rows()), before);
    assert.equal(queries.length, 4);
    assert.ok(queries.every((sql) => !/\b(DROP|ADD)\b/i.test(sql)), 'Column conversion must preserve existing data');
    const inspector = connection.createQueryRunner();
    let table;
    try {
      table = await inspector.getTable('order');
    } finally {
      await inspector.release();
    }
    for (const name of ['real', 'virtual', 'amount', 'unsigned_amount']) {
      assert.equal(table.findColumnByName(name).type, 'decimal');
      assert.equal(table.findColumnByName(name).precision, 16);
      assert.equal(table.findColumnByName(name).scale, 4);
    }
    assert.equal(table.findColumnByName('real').comment, 'balance');
    assert.equal(table.findColumnByName('amount').isNullable, true);
    assert.equal(table.findColumnByName('unsigned_amount').unsigned, true);
    assert.ok(table.indices.some((index) => index.name === 'amount_index'));
    await connection.query("INSERT INTO `order` (`id`,`unchanged`,`label`) VALUES (4,4,'defaults')");
    const defaults = (await rows())[3];
    assert.equal(Number(defaults.real), 0);
    assert.equal(Number(defaults.virtual), 0);
    assert.equal(defaults.amount, null);
    assert.equal(Number(defaults.unsigned_amount), 7);
    const again = connection.createQueryRunner();
    try {
      await new Migration().up(again);
    } finally {
      await again.release();
    }
    assert.equal(queries.length, 4, 'Repeated migration must not alter decimal columns');
    assert.deepEqual(normalize((await rows()).slice(0, 3)), before);
  } finally {
    if (runner) await runner.release();
    if (connection?.isInitialized) await connection.destroy();
    await admin.query(`DROP DATABASE \`${database}\``);
    await admin.destroy();
  }
});
