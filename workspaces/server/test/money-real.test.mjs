import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createUser, rootSession } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

async function connectSession() {
  const { session } = await createUser({ perms: ['kernel.connect'] });

  return session;
}

async function setBalance(username, real) {
  await query('UPDATE unicore_users SET `real` = ? WHERE username = ?', [real, username]);
}

async function balanceOf(username) {
  const rows = await query('SELECT `real` FROM unicore_users WHERE username = ?', [username]);

  return Number(rows[0]?.real ?? 0);
}

async function targetUser() {
  const { username } = await createUser({});
  const admin = await rootSession();
  const { body } = await admin.get(`/users/${username}`);

  return { username, uuid: body?.uuid };
}

describe('Реальная валюта в UnicoreConnect', () => {
  it('баланс отдаётся по uuid', async () => {
    const session = await connectSession();
    const { username, uuid } = await targetUser();

    if (!uuid) return;

    await setBalance(username, 125.5);

    const { status, body } = await session.get(`/cabinet/money/user/${uuid}/real`);

    assert.ok(ok(status), `баланс не отдан: ${status}`);
    assert.equal(body?.uuid, uuid, 'вернулся другой пользователь');
    assert.equal(Number(body?.real), 125.5, `баланс не совпал: ${body?.real}`);
  });

  it('маршрут реального баланса не перехватывается серверным', async () => {
    const session = await connectSession();
    const { uuid } = await targetUser();

    if (!uuid) return;

    const { body } = await session.get(`/cabinet/money/user/${uuid}/real`);

    assert.ok(body && 'real' in body, `вместо реального баланса пришло: ${JSON.stringify(body).slice(0, 120)}`);
  });

  it('начисление увеличивает баланс', async () => {
    const session = await connectSession();
    const { username, uuid } = await targetUser();

    if (!uuid) return;

    await setBalance(username, 10);

    const { status, body } = await session.post('/cabinet/money/user/deposit/real', { user_uuid: uuid, amount: 15.25 });

    assert.ok(ok(status), `начисление отвергнуто: ${status}`);
    assert.equal(Number(body?.real), 25.25, 'ответ не показывает новый баланс');
    assert.equal(await balanceOf(username), 25.25, 'баланс в базе не изменился');
  });

  it('списание уменьшает баланс', async () => {
    const session = await connectSession();
    const { username, uuid } = await targetUser();

    if (!uuid) return;

    await setBalance(username, 40);

    const { status, body } = await session.post('/cabinet/money/user/withdraw/real', { user_uuid: uuid, amount: 15 });

    assert.ok(ok(status), `списание отвергнуто: ${status}`);
    assert.equal(Number(body?.real), 25, 'ответ не показывает новый баланс');
    assert.equal(await balanceOf(username), 25, 'баланс в базе не изменился');
  });

  it('списать больше, чем есть, нельзя', async () => {
    const session = await connectSession();
    const { username, uuid } = await targetUser();

    if (!uuid) return;

    await setBalance(username, 5);

    const { status } = await session.post('/cabinet/money/user/withdraw/real', { user_uuid: uuid, amount: 50 });

    assert.equal(status, 400, `списание сверх баланса прошло: ${status}`);
    assert.equal(await balanceOf(username), 5, 'баланс изменился при отказе');
  });

  it('без права kernel.connect доступа нет', async () => {
    const { session } = await createUser({});
    const { uuid } = await targetUser();

    if (!uuid) return;

    const read = await session.get(`/cabinet/money/user/${uuid}/real`);
    const write = await session.post('/cabinet/money/user/deposit/real', { user_uuid: uuid, amount: 1 });

    assert.equal(read.status, 403, 'баланс отдан без права');
    assert.equal(write.status, 403, 'начисление прошло без права');
  });
});
