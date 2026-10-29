import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { DataSource, MigrationExecutor } from 'typeorm';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const Obfuscator = require('javascript-obfuscator');
const server = resolve(dirname(fileURLToPath(import.meta.url)), '..');

it('keeps all migration identities after production obfuscation', async () => {
  const steps = readdirSync(resolve(server, 'src/migrations/steps')).filter((name) => name.endsWith('.migration.ts')).sort();
  const compiled = await build({
    stdin: { contents: steps.map((name) => `export * from './src/migrations/steps/${name}';`).join('\n'), resolveDir: server },
    bundle: true, platform: 'node', format: 'cjs', write: false, packages: 'external',
    alias: { '@common': resolve(server, 'src/common/constants.ts'), 'src/common/constants': resolve(server, 'src/common/constants.ts') },
  });
  const wrapped = `(function(module, exports, require) { ${compiled.outputFiles[0].text} })(module, module.exports, require);`;
  const bundle = 'migration-fixture.js';
  let output;
  const files = {
    readFileSync(filename) { assert.equal(filename, bundle); return wrapped; },
    writeFileSync(filename, value) { assert.equal(filename, bundle); output = value; },
  };

  runInNewContext(readFileSync(resolve(server, 'obfuscate.js'), 'utf8'), {
    process: { argv: ['node', 'obfuscate.js', bundle] },
    require(name) {
      if (name === 'fs') return files;
      if (name === 'javascript-obfuscator') return { obfuscate: (source, options) => Obfuscator.obfuscate(source, { ...options, seed: 17 }) };
      return require(name);
    },
  });
  const context = { module: { exports: {} }, require, Buffer };

  runInNewContext(output, context);
  const exported = Object.entries(context.module.exports).filter(([, value]) => typeof value === 'function');
  const connection = new DataSource({ type: 'mysql' });

  connection.migrations = exported.map(([, Migration]) => new Migration());
  const migrations = new MigrationExecutor(connection).getMigrations();

  assert.equal(migrations.length, steps.length);
  assert.deepEqual(migrations.map((migration) => migration.name).sort(), exported.map(([name]) => name).sort());
  for (const migration of migrations) assert.equal(migration.timestamp, Number(migration.name.slice(-13)));
  assert.notEqual(context.module.exports.WebRoleOrigins1757080000000.name, 'WebRoleOrigins1757080000000');
});
