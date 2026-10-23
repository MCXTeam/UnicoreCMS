import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
const require = createRequire(import.meta.url);
const ts = require('typescript');

test('a running API discovers the protected worker connection without restart and keeps its token private', { skip: process.platform !== 'linux' }, async (t) => {
  const data = await mkdtemp(join(process.env.TEST_TMPDIR || tmpdir(), 'unicore-connection-'));
  t.after(() => rm(data, { recursive: true, force: true }));
  const filename = fileURLToPath(new URL('../src/admin/updates/updates.service.ts', import.meta.url));
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true } });
  const loaded = new Module(filename);
  loaded.paths = require.resolve.paths('@nestjs/common');
  loaded.require = (name) => name === 'unicore-common/ports' ? { dataRoot: data } : require(name);
  loaded._compile(compiled.outputText, filename);
  const service = new loaded.exports.UpdatesService();
  const original = {};
  for (const key of ['UNICORE_UPDATER_URL', 'UNICORE_UPDATER_TOKEN', 'UNICORE_UPDATER_SOCKET', 'UNICORE_UPDATER_CONNECTION_FILE']) {
    original[key] = process.env[key]; delete process.env[key];
  }
  t.after(() => { for (const [key, value] of Object.entries(original)) value === undefined ? delete process.env[key] : process.env[key] = value; });
  assert.equal((await service.request('/status')).configured, false);
  const token = 'protected-worker-token-'.repeat(3);
  const socketFile = join(data, 'worker.sock');
  const server = createServer((req, res) => {
    assert.equal(req.headers.authorization, `Bearer ${token}`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ configured: true, operations: [], jobs: [] }));
  });
  await new Promise((done) => server.listen(socketFile, done));
  t.after(() => new Promise((done) => server.close(done)));
  await writeFile(join(data, '.unicore-updater.json'), JSON.stringify({ socketFile, token }), { mode: 0o600 });
  const connected = await service.request('/status');
  assert.equal(connected.configured, true);
  assert(!JSON.stringify(connected).includes(token));
  await writeFile(join(data, '.unicore-updater-setup.json'), JSON.stringify({ state: 'preparing' }), { mode: 0o600 });
  assert.equal((await service.request('/status')).setup.state, 'preparing');
});
