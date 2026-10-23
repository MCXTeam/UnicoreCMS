import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire, Module as NodeModule } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { NestFactory } = require('@nestjs/core');
const { Module, Controller, Post, Req } = require('@nestjs/common');
const ts = require('typescript');
const filename = fileURLToPath(new URL('../src/common/update-body-parser.ts', import.meta.url));
const source = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const loaded = new NodeModule(filename);
loaded.paths = require.resolve.paths('express');
loaded._compile(source.outputText, filename);
class InputController {
  login(request) { return { body: request.body, raw: Boolean(request.rawBody) }; }
  update(request) { return { size: request.body.text.length }; }
}
Controller()(InputController);
for (const [method, path] of [['login', 'auth/login'], ['update', 'admin/updates/resolve']]) {
  Post(path)(InputController.prototype, method, Object.getOwnPropertyDescriptor(InputController.prototype, method));
  Req()(InputController.prototype, method, 0);
}
class Fixture {}
Module({ controllers: [InputController] })(Fixture);

test('larger update input preserves normal JSON parsing, raw bodies and the default limit on other routes', async () => {
  const app = await NestFactory.create(Fixture, { logger: false, rawBody: true });
  loaded.exports.installUpdateBodyParser(app);
  await app.listen(0, '127.0.0.1');
  const url = await app.getUrl();
  const post = (path, body) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const normal = await post('/auth/login', { username_or_email: 'fixture', password: 'fixture' });
    assert.equal(normal.status, 201);
    assert.deepEqual(await normal.json(), { body: { username_or_email: 'fixture', password: 'fixture' }, raw: true });
    const large = { text: 'x'.repeat(200000) };
    const update = await post('/admin/updates/resolve', large);
    assert.equal(update.status, 201);
    assert.equal((await update.json()).size, large.text.length);
    assert.equal((await post('/auth/login', large)).status, 413);
    assert.equal((await post('/admin/updates/resolve', { text: 'x'.repeat(1300000) })).status, 413);
  } finally { await app.close(); }
});
