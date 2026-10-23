import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it } from 'node:test';

const server = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(server, 'package.json'));
const ts = require('typescript');
require('reflect-metadata');

function compile(source, imports) {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { experimentalDecorators: true, emitDecoratorMetadata: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)((name) => imports[name] || require(name), module, module.exports);
  return module.exports;
}

it('HWID join validates independently of the separate legacy optional UUID edit', async () => {
  const validation = require('class-validator');
  const committedBase = execFileSync('git', ['show', 'HEAD:workspaces/server/src/auth/gravit/dto/inputs/gravit-join-server.input.ts'], { cwd: server, encoding: 'utf8' });
  const base = compile(committedBase, { '@common': { IsUsername: validation.IsString, SERVER_ID_MAX_LENGTH: 128, TOKEN_MAX_LENGTH: 8192 } });
  const source = readFileSync(resolve(server, 'src/auth/gravit/dto/inputs/gravit-hardware-join.input.ts'), 'utf8');
  const { GravitHardwareJoinInput } = compile(source, { './gravit-join-server.input': base });
  const request = Object.assign(new GravitHardwareJoinInput(), { username: 'HardwarePlayer', serverId: 'test', accessToken: 'test-token' });
  assert.deepEqual(await validation.validate(request), []);
  request.uuid = 'not-a-uuid';
  assert.ok((await validation.validate(request)).some((error) => error.property === 'uuid'));
  request.uuid = 'a2325dbf-afbf-3cc2-a05f-8eb02232f708';
  request.hardwareId = 'not-a-uuid';
  assert.ok((await validation.validate(request)).some((error) => error.property === 'hardwareId'));
});
