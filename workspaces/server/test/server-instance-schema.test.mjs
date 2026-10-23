import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const { DataSource, Entity, PrimaryColumn } = require('typeorm');
class Server {}
Entity('fixture_server')(Server);
PrimaryColumn({ type: 'varchar' })(Server.prototype, 'id');
const filename = fileURLToPath(new URL('../src/game/servers/entities/server-instance.entity.ts', import.meta.url));
const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true, emitDecoratorMetadata: true } });
const loaded = new Module(filename);
loaded.paths = require.resolve.paths('typeorm');
loaded.require = (name) => name === './server.entity' ? { Server } : require(name);
loaded._compile(compiled.outputText, filename);
const { ServerInstance } = loaded.exports;

for (const type of ['mysql', 'mariadb']) test(`server instance UUID metadata is valid for ${type}`, async () => {
  const db = new DataSource({ type, database: 'fixture', entities: [Server, ServerInstance] });
  db.driver.uuidColumnTypeSuported = type === 'mariadb';
  await db.buildMetadatas();
  const entity = db.getMetadata(ServerInstance);
  const id = entity.columns.find((column) => column.propertyName === 'id');
  assert.equal(id.generationStrategy, 'uuid');
  assert.equal(db.driver.normalizeType(id), type === 'mariadb' ? 'uuid' : 'varchar');
  assert.equal(db.driver.getColumnLength(id), type === 'mariadb' ? '' : '36');
  assert.deepEqual(entity.primaryColumns.map((column) => column.propertyName), ['priority', 'serverId']);
});
