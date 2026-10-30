import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url),
  server = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workerThreads = process.env.ESBUILD_WORKER_THREADS;
process.env.ESBUILD_WORKER_THREADS = '0';
const { build } = require('esbuild'),
  api = require('unicore-api/server');
if (workerThreads === undefined) delete process.env.ESBUILD_WORKER_THREADS;
else process.env.ESBUILD_WORKER_THREADS = workerThreads;
require('reflect-metadata');
let directory, load;
before(async () => {
  directory = mkdtempSync(join(tmpdir(), 'unicore-module-admission-'));
  mkdirSync(join(directory, 'node_modules'));
  for (const name of ['unicore-api', 'unicore-common', '@nestjs', 'typeorm', 'semver']) {
    const source =
      name === 'unicore-api'
        ? resolve(server, '../api')
        : name === 'unicore-common'
        ? resolve(server, '../common')
        : resolve(server, '../../node_modules', name);
    symlinkSync(realpathSync(source), join(directory, 'node_modules', name), process.platform === 'win32' ? 'junction' : 'dir');
  }
  await build({
    entryPoints: [join(server, 'src/modules/runtime/loader.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    outfile: join(directory, 'loader.cjs'),
    alias: { 'src/common/constants': join(server, 'src/common/constants.ts') },
    logLevel: 'silent',
  });
  load = require(join(directory, 'loader.cjs')).load;
});
after(() => {
  if (directory) rmSync(directory, { recursive: true, force: true });
});
const ids = [];
function module(id, requires = {}, enabled = true, throws = false) {
  ids.push(id);
  const dir = join(directory, id);
  mkdirSync(dir);
  const manifest = { id, name: id, version: '1.0.0', unicoreApi: '^1.15.0', server: './index.cjs', requires: { modules: requires } };
  writeFileSync(join(dir, 'module.json'), JSON.stringify(manifest));
  writeFileSync(
    join(dir, 'index.cjs'),
    `globalThis[${JSON.stringify('evaluated_' + id)}]=true;${
      throws ? 'throw Error("failed dependency")' : `require('unicore-api/server').defineModule({id:${JSON.stringify(id)}})`
    }`,
  );
  return { id, dir, manifest, enabled, serverEntry: join(dir, 'index.cjs') };
}

test('missing, disabled and cyclic dependencies are rejected before any top-level code executes', () => {
  const missing = module('missing_dep', { absent: '*' });
  const disabled = module('disabled_dep', {}, false),
    usesDisabled = module('uses_disabled', { disabled_dep: '*' });
  const first = module('cycle_first', { cycle_second: '*' }),
    second = module('cycle_second', { cycle_first: '*' });
  const result = load([missing, disabled, usesDisabled, first, second]);
  assert.equal(result.loaded.length, 0);
  for (const id of ids) assert.equal(globalThis['evaluated_' + id], undefined);
});

test('unlicensed official paid code and its transitive dependents never execute, while free code loads', () => {
  const paid = module('style'),
    dependent = module('needs_style', { style: '*' }),
    free = module('independent_free');
  const result = load([paid, dependent, free]);
  assert.deepEqual(
    result.loaded.map((item) => item.id),
    ['independent_free'],
  );
  assert.equal(globalThis.evaluated_style, undefined);
  assert.equal(globalThis.evaluated_needs_style, undefined);
  assert.equal(globalThis.evaluated_independent_free, true);
  api.getRegistry().modules.delete('independent_free');
});

test('a dependency failing at require prevents evaluation of its consumer', () => {
  const broken = module('broken_require', {}, true, true),
    dependent = module('uses_broken', { broken_require: '*' });
  const result = load([dependent, broken]);
  assert.equal(result.loaded.length, 0);
  assert.equal(globalThis.evaluated_broken_require, true);
  assert.equal(globalThis.evaluated_uses_broken, undefined);
});
