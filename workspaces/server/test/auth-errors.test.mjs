import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../../common/src/messages.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { authErrorKey } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const failure = (status, message) => ({ response: { status, data: { message } } });

test('only a registration conflict is reported as an existing account', () => {
  assert.equal(authErrorKey(failure(409), 'register'), 'auth.already_exists');
  assert.notEqual(authErrorKey(failure(409), 'session'), 'auth.already_exists');
  for (const status of [400, 401, 403, 404, 422, 429, 500, 502, 503]) {
    assert.notEqual(authErrorKey(failure(status), 'register'), 'auth.already_exists');
  }
});

test('transport and service failures never accuse the user of invalid credentials', () => {
  for (const operation of ['login', 'totp', 'register', 'verify', 'reset', 'password', 'resend', 'session']) {
    assert.equal(authErrorKey(new Error('Network Error'), operation), 'error.request_failed');
    assert.equal(authErrorKey(failure(503), operation), 'error.service_unavailable');
    assert.equal(authErrorKey(failure(429), operation), 'error.too_many_requests');
  }
});

test('known server messages and validation failures remain distinguishable', () => {
  assert.equal(authErrorKey(failure(400, 'error.recaptcha'), 'register'), 'error.recaptcha');
  assert.equal(authErrorKey(failure(400, ['email must be an email']), 'register'), 'error.invalid_input');
  assert.equal(authErrorKey(failure(500, 'SQL SELECT private data'), 'reset'), 'error.service_unavailable');
  assert.equal(authErrorKey(failure(401), 'login'), 'auth.wrong_credentials');
  assert.equal(authErrorKey(failure(401), 'totp'), 'auth.totp_wrong');
});

test('reset links are only reported as expired when the server rejects the link', () => {
  assert.equal(authErrorKey(failure(404), 'password'), 'auth.reset_link_invalid');
  assert.equal(authErrorKey(failure(410), 'password'), 'auth.reset_link_invalid');
  assert.equal(authErrorKey(failure(400), 'password'), 'error.invalid_input');
  assert.equal(authErrorKey(failure(500), 'password'), 'error.service_unavailable');
  assert.notEqual(authErrorKey(failure(404), 'reset'), 'auth.email_not_found');
});

async function passwordForm(error) {
  const page = await readFile(new URL('../../client/pages/auth/password.vue', import.meta.url), 'utf8');
  const script = page.slice(page.indexOf('async function reset()'), page.lastIndexOf('</script>'));
  const code = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const notifications = [];
  const redirects = [];
  let closed = false;
  const run = new Function('$unicore', 'authFlow', 'form', 'route', '$t', 'navigateTo', 'responseStatus', `${code}; return reset();`);
  await run(
    {
      loading: () => ({
        close: () => {
          closed = true;
        },
      }),
      authErrorNotification: (value, operation) => notifications.push(authErrorKey(value, operation)),
      successNotification: () => assert.fail('failed request must not report success'),
    },
    {
      password: async () => {
        throw error;
      },
    },
    { password: 'not-transmitted' },
    { query: { hash: 'not-transmitted' } },
    (key) => key,
    async (path) => redirects.push(path),
    (value) => value?.response?.status,
  );
  assert.equal(closed, true);
  return { notifications, redirects };
}

test('the real password form preserves the form after a temporary failure', async () => {
  assert.deepEqual(await passwordForm(failure(503)), {
    notifications: ['error.service_unavailable'],
    redirects: [],
  });
});

test('the real password form sends expired links to request a new one', async () => {
  assert.deepEqual(await passwordForm(failure(404)), {
    notifications: ['auth.reset_link_invalid'],
    redirects: ['/auth/reset'],
  });
});
