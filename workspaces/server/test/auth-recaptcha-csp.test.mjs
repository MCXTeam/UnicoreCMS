import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../../common/src/security.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function('exports', 'require', compiled)(exports, (name) => {
  if (name === './constants') return { HTTPS_PROTOCOL: 'https:', CSP_WEBSOCKET_PROTOCOL: 'ws' };
  if (name === 'node:crypto') return {};
  throw new Error(name);
});
const directives = (recaptcha) =>
  new Map(
    exports
      .contentSecurityPolicy({
        nonce: 'test-nonce',
        apiBaseurl: 'https://api.example.test',
        recaptcha,
      })
      .split('; ')
      .map((value) => {
        const [name, ...sources] = value.split(' ');
        return [name, sources];
      }),
  );

test('enabled captcha can load its frames without allowing arbitrary frames', () => {
  const policy = directives(true);
  for (const origin of ['https://www.google.com/recaptcha/', 'https://recaptcha.net/recaptcha/', 'https://www.recaptcha.net/recaptcha/']) {
    assert.ok(policy.get('frame-src')?.includes(origin), `Missing frame permission for ${origin}`);
    assert.ok(policy.get('connect-src')?.includes(origin));
  }
  assert.ok(!policy.get('frame-src').includes('*'));
  assert.ok(!policy.get('frame-src').includes('https:'));
  assert.deepEqual(policy.get('frame-ancestors'), ["'none'"]);
  assert.deepEqual(policy.get('object-src'), ["'none'"]);
  assert.ok(policy.get('script-src').includes("'nonce-test-nonce'"));
});

test('disabled captcha does not allow external frames', () => {
  const policy = directives(false);
  assert.deepEqual(policy.get('frame-src') ?? policy.get('default-src'), ["'self'"]);
  assert.ok(!policy.get('connect-src').some((value) => value.includes('recaptcha')));
});
