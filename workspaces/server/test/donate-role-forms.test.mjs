import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const workspaces = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const lodash = require('lodash').runInContext();
function evaluate(source, imports) {
  const exports = {};
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  runInNewContext(compiled, { exports, require: imports, defineNuxtPlugin: (callback) => callback });
  return exports;
}
evaluate(readFileSync(resolve(workspaces, 'admin/plugins/lodash.ts'), 'utf8'), (name) => name === 'lodash' ? lodash : require(name));
function options(page) {
  const file = resolve(workspaces, `admin/pages/donate/${page}.vue`);
  const script = readFileSync(file, 'utf8').match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
  return evaluate(script, (name) => name === 'vee-validate' ? { Form: {}, Field: {} } : require(name)).default;
}
for (const [page, model] of [['groups', 'group'], ['permissions', 'permission']]) {
  describe(`Donor ${page} editor`, () => {
    it('retains its linked role and purchase setting across reopening and an unrelated save', async () => {
      const component = options(page);
      const context = {
        ...component.data(), $_: lodash, types: [{ value: 'game' }],
        translations: { attach() {}, async load() {}, async save() {} },
        $t: (key) => key, $toast: { add() {} }, async load() {}, $utils: { notifyError(error) { throw error; } },
      };
      const value = { ...context[model], id: 7, name: 'Staff', web_role_id: 'moder', purchasable: false, price: 0, type: 'game', servers: [{ id: 'dev' }] };
      let body;
      context.$api = { async get() { return { data: value }; }, async patch(_url, input) { body = input; } };
      await component.methods.openDialog.call(context, { id: 7 });
      assert.equal(context[model].web_role_id, 'moder');
      assert.equal(context[model].purchasable, false);
      await component.methods[model === 'group' ? 'updateGroup' : 'updatePermission'].call(context);
      assert.equal(body.web_role_id, 'moder');
      assert.equal(body.purchasable, false);
      await component.methods.openDialog.call(context);
      assert.equal(context[model].web_role_id, null);
      assert.equal(context[model].purchasable, true);
    });
    it('disables roles that the actor may not assign', () => {
      const component = options(page);
      const result = component.computed.roleOptions.call({ roles: [{ id: 'owner', grantable: false }, { id: 'vip', grantable: true }] });
      assert.equal(result.find((role) => role.id === 'owner').locked, true);
      assert.equal(result.find((role) => role.id === 'vip').locked, false);
    });
  });
}
