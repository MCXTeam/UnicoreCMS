import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url),
  server = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const obfuscator = require('javascript-obfuscator');
const source = readFileSync(resolve(server, 'src/game/donate/permissions/permissions.service.ts'), 'utf8');
const ast = ts.createSourceFile('permissions.service.ts', source, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.find((node) => ts.isClassDeclaration(node) && node.name?.text === 'DonatePermissionsService');
const grant = declaration.members.find((node) => ts.isMethodDeclaration(node) && node.name?.getText(ast) === 'grant');
const compiled = ts.transpileModule(`class Harness { ${grant.getText(ast)} }; module.exports = Harness;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function protect(seed) {
  let result;
  runInNewContext(readFileSync(resolve(server, 'obfuscate.js'), 'utf8'), {
    process: { argv: ['node', 'obfuscate.js', 'fixture.js'] },
    require(name) {
      if (name === 'fs')
        return {
          readFileSync: () => compiled,
          writeFileSync: (_filename, value) => {
            result = value;
          },
        };
      if (name === 'javascript-obfuscator') return { obfuscate: (text, options) => obfuscator.obfuscate(text, { ...options, seed }) };
      return require(name);
    },
  });
  return result;
}
async function verify(code, kind) {
  const context = {
    module: { exports: {} },
    PermissionType: { Web: 'web' },
    UsersDonatePermission: class {},
    runAfterCommit: (callback) => callback(),
    events: () => ({ emit: async () => {} }),
  };
  runInNewContext(code, context);
  let writes = 0;
  const service = Object.assign(new context.module.exports(), {
    userPermissionsRepository: {
      save: async (value) => {
        writes++;
        return value;
      },
    },
    webRoles: { grantForPermission: async () => {} },
    issuanceService: { isRcon: () => false },
    eventsService: { emitKernel() {} },
  });
  const result = await service.grant(
    null,
    { uuid: 'fixture-user' },
    kind === 'web' ? undefined : { id: 'fixture-server' },
    { id: 1, type: kind },
    null,
    0,
  );
  assert.equal(writes, 1);
  assert.equal(result.permission.id, 1);
  assert.equal(result.server?.id, kind === 'web' ? undefined : 'fixture-server');
}

test('production obfuscation preserves lazy evaluation in the actual permission grant method', async () => {
  for (const kind of ['web', 'game']) {
    await verify(compiled, kind);
    for (const seed of [17, 1, 417]) await verify(protect(seed), kind);
  }
});
