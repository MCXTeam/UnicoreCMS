import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createAdmin, createUser } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

const balanceOf = async (username) => {
  const rows = await query('SELECT `real` AS money FROM unicore_users WHERE username = ?', [username]);

  return Number(rows[0]?.money ?? 0);
};

describe('Пополнения в панели', () => {
  it('без прав раздел пополнений закрыт', async () => {
    const { session } = await createAdmin(['panel.revenue.access']);

    const { status } = await session.get('/admin/payments');

    assert.equal(status, 403);
  });

  it('с правом просмотра список отдаётся', async () => {
    const { session } = await createAdmin(['panel.revenue.access', 'panel.revenue.payments']);

    const { status, body } = await session.get('/admin/payments');

    assert.ok(ok(status), `список пополнений отвергнут: ${status}`);
    assert.ok(Array.isArray(body?.data), 'ожидали постраничный список');
  });

  it('поиск игрока доступен по праву создания пополнений', async () => {
    const target = await createUser();
    const { session } = await createAdmin(['panel.revenue.access', 'panel.revenue.payments', 'panel.revenue.payments.create']);

    const { status, body } = await session.get(`/admin/payments/players?search=${target.username}`);

    assert.ok(ok(status), `поиск игрока отвергнут: ${status}`);
    assert.ok(
      (body || []).some((player) => player.username === target.username),
      'игрок не найден по нику',
    );
  });

  it('поиск игрока закрыт без права создания', async () => {
    const { session } = await createAdmin(['panel.revenue.access', 'panel.revenue.payments']);

    const { status } = await session.get('/admin/payments/players?search=e2e');

    assert.equal(status, 403);
  });

  it('открытое пополнение не трогает баланс', async () => {
    const target = await createUser();
    const before = await balanceOf(target.username);
    const { session } = await createAdmin(['panel.revenue.access', 'panel.revenue.payments', 'panel.revenue.payments.create']);

    const { status, body } = await session.post('/admin/payments', { username: target.username, amount: 100, paid: false });

    assert.ok(ok(status), `создание отвергнуто: ${status} ${JSON.stringify(body)}`);
    assert.equal(body?.status, 'waiting', 'ожидали открытое пополнение');
    assert.equal(await balanceOf(target.username), before, 'баланс изменился до зачисления');
  });

  it('завершённое пополнение зачисляет деньги', async () => {
    const target = await createUser();
    const before = await balanceOf(target.username);
    const { session } = await createAdmin(['panel.revenue.access', 'panel.revenue.payments', 'panel.revenue.payments.create']);

    const { status } = await session.post('/admin/payments', { username: target.username, amount: 150, paid: true });

    assert.ok(ok(status), `создание отвергнуто: ${status}`);
    assert.equal(await balanceOf(target.username), before + 150, 'деньги не зачислены');
  });

  it('перевод открытого пополнения в завершённое зачисляет деньги', async () => {
    const target = await createUser();
    const before = await balanceOf(target.username);
    const { session } = await createAdmin(['panel.revenue.access', 'panel.revenue.payments', 'panel.revenue.payments.create']);

    const created = await session.post('/admin/payments', { username: target.username, amount: 70, paid: false });

    assert.ok(ok(created.status), `создание отвергнуто: ${created.status}`);
    assert.equal(await balanceOf(target.username), before, 'баланс изменился раньше времени');

    const updated = await session.patch(`/admin/payments/${created.body.id}`, { status: 'paid' });

    assert.ok(ok(updated.status), `зачисление отвергнуто: ${updated.status} ${JSON.stringify(updated.body)}`);
    assert.equal(await balanceOf(target.username), before + 70, 'деньги не зачислены при смене статуса');
  });

  it('завершённое пополнение повторно не зачисляется', async () => {
    const target = await createUser();
    const { session } = await createAdmin(['panel.revenue.access', 'panel.revenue.payments', 'panel.revenue.payments.create']);

    const created = await session.post('/admin/payments', { username: target.username, amount: 40, paid: true });
    const after = await balanceOf(target.username);

    const repeat = await session.patch(`/admin/payments/${created.body.id}`, { status: 'paid' });

    assert.ok(repeat.status >= 400, 'повторное зачисление прошло');
    assert.equal(await balanceOf(target.username), after, 'баланс вырос при повторном зачислении');
  });

  it('сумму открытого пополнения можно поправить', async () => {
    const target = await createUser();
    const { session } = await createAdmin(['panel.revenue.access', 'panel.revenue.payments', 'panel.revenue.payments.create']);

    const created = await session.post('/admin/payments', { username: target.username, amount: 10, paid: false });
    const updated = await session.patch(`/admin/payments/${created.body.id}`, { amount: 25 });

    assert.ok(ok(updated.status), `правка суммы отвергнута: ${updated.status}`);
    assert.equal(Number(updated.body?.amount), 25);
  });

  it('пополнение неизвестному игроку не создаётся', async () => {
    const { session } = await createAdmin(['panel.revenue.access', 'panel.revenue.payments', 'panel.revenue.payments.create']);

    const { status } = await session.post('/admin/payments', { username: 'e2enosuchplayer', amount: 10 });

    assert.equal(status, 404);
  });

  it('создание пополнения закрыто без права', async () => {
    const target = await createUser();
    const { session } = await createAdmin(['panel.revenue.access', 'panel.revenue.payments']);

    const { status } = await session.post('/admin/payments', { username: target.username, amount: 10 });

    assert.equal(status, 403);
  });
});
