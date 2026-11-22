import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../../client/composables/useAuthFlow.ts', import.meta.url), 'utf8');
const script = source
  .replace("import { useReCaptcha } from 'vue-recaptcha-v3'", '')
  .replace('export const useAuthFlow', 'const useAuthFlow');
const compiled = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const captchaSource = await readFile(new URL('../../client/composables/useAuthRecaptcha.ts', import.meta.url), 'utf8');
const captchaScript = captchaSource
  .replace("import { useReCaptcha } from 'vue-recaptcha-v3'", '')
  .replace('export const useAuthRecaptcha', 'const useAuthRecaptcha');
const captchaCompiled = ts.transpileModule(captchaScript, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const createCaptcha = new Function('useReCaptcha', `${captchaCompiled}; return useAuthRecaptcha();`);
const flowFactory = new Function('useApi', 'useAuthRecaptcha', `${compiled}; return useAuthFlow();`);
const createFlow = (api, provider) => flowFactory(api, () => createCaptcha(provider));

test('reset request, link check and password change each send a fresh reset captcha', async () => {
  const calls = [];
  const actions = [];
  let ready = 0;
  const flow = createFlow(
    () => ({
      post: async (...args) => {
        calls.push(args);
        return { data: { ok: true } };
      },
    }),
    () => ({
      recaptchaLoaded: async () => {
        ready += 1;
      },
      executeRecaptcha: async (action) => {
        actions.push(action);
        return `captcha-${actions.length}`;
      },
    }),
  );

  await flow.reset({ email: 'test@example.invalid' });
  await flow.password({ hash: 'test-link' });
  await flow.password({ hash: 'test-link', password: 'test-password' });

  assert.equal(ready, 3);
  assert.deepEqual(actions, ['reset', 'reset', 'reset']);
  assert.deepEqual(
    calls.map(([path, , options]) => [path, options.headers.recaptcha]),
    [
      ['/auth/reset', 'captcha-1'],
      ['/auth/password', 'captcha-2'],
      ['/auth/password', 'captcha-3'],
    ],
  );
  assert.deepEqual(calls[2][1], { hash: 'test-link', password: 'test-password' });
});

test('a failed captcha prevents the request and has a recognizable message', async () => {
  const flow = createFlow(
    () => ({ post: () => assert.fail('must not send a reset without the failed captcha') }),
    () => ({
      recaptchaLoaded: async () => {
        throw new Error('provider unavailable');
      },
    }),
  );
  await assert.rejects(flow.reset({}), { message: 'error.recaptcha' });
  await assert.rejects(flow.password({}), { message: 'error.recaptcha' });
});

test('installations without configured captcha keep their existing behavior', async () => {
  const flow = createFlow(
    () => ({
      post: async (path, payload, options) => {
        assert.deepEqual(options, { timeout: 30_000 });
        return { data: 'ok' };
      },
    }),
    () => undefined,
  );
  assert.equal(await flow.reset({}), 'ok');
});

test('a stalled captcha releases the form instead of waiting forever', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let outcome = 'pending';
  const flow = createFlow(
    () => ({ post: () => assert.fail('must not send a request after captcha timeout') }),
    () => ({ recaptchaLoaded: () => new Promise(() => {}) }),
  );
  const pending = flow.reset({}).catch((error) => {
    outcome = error.message;
  });
  context.mock.timers.tick(20001);
  for (let i = 0; i < 10; i++) await Promise.resolve();
  assert.equal(outcome, 'error.recaptcha_timeout');
  await pending;
});

test('a late token cannot submit a timed-out request, and a retry can succeed', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let resolveToken;
  let calls = 0;
  let attempt = 0;
  const flow = createFlow(
    () => ({
      post: async () => {
        calls++;
        return { data: 'ok' };
      },
    }),
    () => ({
      recaptchaLoaded: async () => true,
      executeRecaptcha: () =>
        ++attempt === 1
          ? new Promise((resolve) => {
              resolveToken = resolve;
            })
          : Promise.resolve('fresh-token'),
    }),
  );
  const pending = assert.rejects(flow.reset({}), { message: 'error.recaptcha_timeout' });
  for (let i = 0; i < 10; i++) await Promise.resolve();
  context.mock.timers.tick(20001);
  await pending;
  resolveToken('expired-token');
  for (let i = 0; i < 10; i++) await Promise.resolve();
  assert.equal(calls, 0);
  assert.equal(await flow.reset({}), 'ok');
  assert.equal(calls, 1);
});

test('a configured captcha must produce a nonempty token', async () => {
  const flow = createFlow(
    () => ({ post: () => assert.fail('must reject missing captcha token') }),
    () => ({ recaptchaLoaded: async () => true, executeRecaptcha: async () => '' }),
  );
  await assert.rejects(flow.password({}), { message: 'error.recaptcha' });
});
