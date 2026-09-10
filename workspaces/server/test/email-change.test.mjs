import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createUser, PASSWORD } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

const address = (username) => `${username}-new@example.com`;

async function pendingCode(username) {
  const rows = await query(
    'SELECT c.code FROM unicore_email_changes c JOIN unicore_users u ON u.uuid = c.user_uuid WHERE u.username = ? ORDER BY c.created DESC LIMIT 1',
    [username],
  );

  return rows[0]?.code ?? null;
}

describe('Смена почты в кабинете', () => {
  it('без текущего пароля код не отправляется', async () => {
    const { username, session } = await createUser({});

    const { status } = await session.post('/cabinet/settings/email', { email: address(username), password: 'НеТотПароль1!' });

    assert.equal(status, 400, `смена почты прошла без верного пароля: ${status}`);
    assert.equal(await pendingCode(username), null, 'заявка на смену почты создана без верного пароля');
  });

  it('с верным паролем код уходит и почта меняется', async () => {
    const { username, session } = await createUser({});
    const next = address(username);

    const requested = await session.post('/cabinet/settings/email', { email: next, password: PASSWORD });

    assert.ok(requested.status >= 200 && requested.status < 300, `запрос кода отвергнут: ${requested.status}`);

    const code = await pendingCode(username);

    assert.ok(code, 'код не создан');

    const wrong = await session.post('/cabinet/settings/email/confirm', { code: '000000' });

    assert.equal(wrong.status, 404, 'неверный код принят');

    const rows = await query('SELECT email FROM unicore_users WHERE username = ?', [username]);

    assert.notEqual(rows[0]?.email, next, 'почта сменилась до подтверждения');

    const confirmed = await session.post('/cabinet/settings/email/confirm', { code });

    assert.ok(confirmed.status >= 200 && confirmed.status < 300, `подтверждение отвергнуто: ${confirmed.status}`);

    const after_ = await query('SELECT email FROM unicore_users WHERE username = ?', [username]);

    assert.equal(after_[0]?.email, next, 'почта не сменилась после верного кода');
    assert.equal(await pendingCode(username), null, 'заявка осталась после подтверждения');
  });

  it('повторно тот же код не срабатывает', async () => {
    const { username, session } = await createUser({});
    const next = address(username);

    await session.post('/cabinet/settings/email', { email: next, password: PASSWORD });

    const code = await pendingCode(username);

    await session.post('/cabinet/settings/email/confirm', { code });

    const again = await session.post('/cabinet/settings/email/confirm', { code });

    assert.equal(again.status, 404, 'использованный код принят второй раз');
  });

  it('занятую другим аккаунтом почту поставить нельзя', async () => {
    const owner = await createUser({});
    const { session } = await createUser({});

    const { status, body } = await session.post('/cabinet/settings/email', {
      email: `${owner.username}@example.com`,
      password: PASSWORD,
    });

    assert.equal(status, 409, `занятая почта принята: ${status}`);
    assert.equal(body?.message, 'error.email_taken', 'причина отказа не дошла до клиента');
  });

  it('новая заявка отменяет предыдущую', async () => {
    const { username, session } = await createUser({});

    await session.post('/cabinet/settings/email', { email: `${username}-one@example.com`, password: PASSWORD });

    const first = await pendingCode(username);

    await session.post('/cabinet/settings/email', { email: `${username}-two@example.com`, password: PASSWORD });

    const rows = await query(
      'SELECT COUNT(*) AS total FROM unicore_email_changes c JOIN unicore_users u ON u.uuid = c.user_uuid WHERE u.username = ?',
      [username],
    );

    assert.equal(Number(rows[0]?.total), 1, 'старые заявки на смену почты остались в базе');

    const { status } = await session.post('/cabinet/settings/email/confirm', { code: first });

    assert.equal(status, 404, 'код из отменённой заявки сработал');
  });
});
