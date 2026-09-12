import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { after, describe, it } from 'node:test';
import { api } from './helpers/env.mjs';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createAdmin, createRole, createUser, rootSession } from './helpers/stand.mjs';

after(async () => {
  await query('DELETE FROM mod_partner_accruals').catch(() => null);
  await query('DELETE FROM mod_partner_payouts').catch(() => null);
  await query('DELETE FROM mod_partner_partners').catch(() => null);
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

async function uuidOf(username) {
  const rows = await query('SELECT uuid FROM unicore_users WHERE username = ?', [username]);

  return rows[0]?.uuid ?? null;
}

async function realOf(username) {
  const rows = await query('SELECT `real` FROM unicore_users WHERE username = ?', [username]);

  return Number(rows[0]?.real ?? 0);
}

const REFERAL_PERCENT = 10;

async function pair({ rewarded = false } = {}) {
  const roles = rewarded ? [await createRole([], { referal_percent: REFERAL_PERCENT })] : [];
  const inviter = await createUser({ roles });
  const referal = await createUser({});
  const inviterUuid = await uuidOf(inviter.username);
  const referalUuid = await uuidOf(referal.username);

  await query('INSERT INTO unicore_referals (user_uuid, inviter_uuid) VALUES (?, ?)', [referalUuid, inviterUuid]);

  return { inviter, referal, inviterUuid, referalUuid };
}

const CENTAPP_TOKEN = process.env.CENTAPP_TOKEN ?? '';

let webhookReady = null;

async function paymentsDrivable() {
  if (webhookReady === null) {
    const response = await fetch(`${api}/payment/methods/centapp/handler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    webhookReady = response.status !== 404;

    if (!webhookReady)
      console.log('Проверки начислений пропущены: метод centapp выключен, стенд поднимать с CENTAPP_ENABLED=true');
  }

  return webhookReady;
}

async function payment(uuid, amount) {
  const rows = await query(
    "INSERT INTO unicore_payments (method, status, amount, user_uuid, ip) VALUES ('centapp', 'waiting', ?, ?, '127.0.0.1')",
    [amount, uuid],
  );

  return rows.insertId;
}

async function complete(id) {
  const rows = await query('SELECT amount FROM unicore_payments WHERE id = ?', [id]);
  const OutSum = String(rows[0].amount);
  const SignatureValue = crypto.createHash('md5').update([OutSum, id, CENTAPP_TOKEN].join(':')).digest('hex').toUpperCase();

  const response = await fetch(`${api}/payment/methods/centapp/handler`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ OutSum, InvId: id, TrsId: `t${id}`, SignatureValue, Status: 'OK' }),
  });

  const text = await response.text();

  assert.ok(response.ok && !text.includes('sign'), `оплата не проведена: ${response.status} ${text.slice(0, 80)}`);

  await new Promise((resolve) => setTimeout(resolve, 1200));
}

describe('Партнёрская программа', () => {
  it('партнёру начисляется процент от пополнения реферала', async () => {
    if (!(await paymentsDrivable())) return;

    const { inviter, inviterUuid, referalUuid } = await pair();
    const admin = await rootSession();

    const created = await admin.post('/mod/partner', { username: inviter.username, percent: 10 });

    assert.ok(ok(created.status), `партнёр не создан: ${created.status} ${JSON.stringify(created.body)}`);

    const before = await realOf(inviter.username);
    const id = await payment(referalUuid, 200);

    await complete(id);

    const accruals = await query('SELECT * FROM mod_partner_accruals WHERE partner_uuid = ?', [inviterUuid]);

    assert.equal(accruals.length, 1, 'начисление не создано');
    assert.equal(Number(accruals[0].reward), 20, `начислено ${accruals[0].reward} вместо 20`);
    assert.equal(Number(accruals[0].percent), 10, 'процент не зафиксирован');
    assert.equal(await realOf(inviter.username), before, 'обычный реферальный процент всё ещё начисляется партнёру');
  });

  it('смена процента не меняет прошлые начисления', async () => {
    if (!(await paymentsDrivable())) return;

    const { inviter, inviterUuid, referalUuid } = await pair();
    const admin = await rootSession();

    await admin.post('/mod/partner', { username: inviter.username, percent: 10 });
    await complete(await payment(referalUuid, 100));

    await admin.patch(`/mod/partner/${inviterUuid}`, { percent: 50 });
    await complete(await payment(referalUuid, 100));

    const rows = await query('SELECT reward, percent FROM mod_partner_accruals WHERE partner_uuid = ? ORDER BY id', [inviterUuid]);

    assert.deepEqual(
      rows.map((row) => Number(row.percent)),
      [10, 50],
      'проценты начислений разъехались',
    );
    assert.deepEqual(
      rows.map((row) => Number(row.reward)),
      [10, 50],
      'старое начисление изменилось после смены процента',
    );
  });

  it('обычный реферальный процент работает у не-партнёра', async () => {
    if (!(await paymentsDrivable())) return;

    const { inviter, referalUuid } = await pair({ rewarded: true });
    const before = await realOf(inviter.username);

    await complete(await payment(referalUuid, 100));

    assert.equal(await realOf(inviter.username), before + REFERAL_PERCENT, 'обычный реферальный процент не начислен');
  });

  it('активный партнёр вместо обычного процента получает партнёрский', async () => {
    if (!(await paymentsDrivable())) return;

    const { inviter, inviterUuid, referalUuid } = await pair({ rewarded: true });
    const admin = await rootSession();

    await admin.post('/mod/partner', { username: inviter.username, percent: 20 });

    const before = await realOf(inviter.username);

    await complete(await payment(referalUuid, 100));

    const accruals = await query('SELECT reward FROM mod_partner_accruals WHERE partner_uuid = ?', [inviterUuid]);

    assert.equal(accruals.length, 1, 'партнёрское начисление не создано');
    assert.equal(Number(accruals[0].reward), 20, 'партнёрский процент посчитан неверно');
    assert.equal(await realOf(inviter.username), before, 'обычный реферальный процент не отключился');
  });

  it('неактивному партнёру возвращается обычный процент', async () => {
    if (!(await paymentsDrivable())) return;

    const { inviter, inviterUuid, referalUuid } = await pair({ rewarded: true });
    const admin = await rootSession();

    await admin.post('/mod/partner', { username: inviter.username, percent: 20, active: false });

    const before = await realOf(inviter.username);

    await complete(await payment(referalUuid, 100));

    const accruals = await query('SELECT id FROM mod_partner_accruals WHERE partner_uuid = ?', [inviterUuid]);

    assert.equal(accruals.length, 0, 'неактивному партнёру начислено');
    assert.equal(await realOf(inviter.username), before + REFERAL_PERCENT, 'обычный реферальный процент не вернулся');
  });

  it('выплата резервирует сумму и закрывается', async () => {
    if (!(await paymentsDrivable())) return;

    const { inviter, inviterUuid, referalUuid } = await pair();
    const admin = await rootSession();

    await admin.post('/mod/partner', { username: inviter.username, percent: 10 });
    await complete(await payment(referalUuid, 500));

    const created = await admin.post(`/mod/partner/${inviterUuid}/payouts`, { amount: 30, kind: 'requisites', requisites: 'карта' });

    assert.ok(ok(created.status), `выплата не создана: ${created.status}`);

    const card = await admin.get(`/mod/partner/${inviterUuid}`).then((res) => res.body);

    assert.equal(Number(card.earned), 50, 'начислено посчитано неверно');
    assert.equal(Number(card.pending), 30, 'выплата не попала в ожидающие');
    assert.equal(Number(card.available), 20, 'ожидающая выплата не зарезервировала сумму');

    const complete_ = await admin.patch(`/mod/partner/payouts/${created.body.id}/complete`, {});

    assert.ok(ok(complete_.status), 'выплату не удалось закрыть');

    const after_ = await admin.get(`/mod/partner/${inviterUuid}`).then((res) => res.body);

    assert.equal(Number(after_.paid), 30, 'выплата не учтена как выполненная');
    assert.equal(Number(after_.available), 20, 'доступное изменилось после закрытия выплаты');
  });

  it('нельзя вывести больше доступного', async () => {
    if (!(await paymentsDrivable())) return;

    const { inviter, inviterUuid, referalUuid } = await pair();
    const admin = await rootSession();

    await admin.post('/mod/partner', { username: inviter.username, percent: 10 });
    await complete(await payment(referalUuid, 100));

    const { status } = await admin.post(`/mod/partner/${inviterUuid}/payouts`, { amount: 999, kind: 'requisites' });

    assert.equal(status, 400, `выплата сверх остатка прошла: ${status}`);
  });

  it('партнёр обменивает остаток на баланс сайта', async () => {
    if (!(await paymentsDrivable())) return;

    const { inviter, inviterUuid, referalUuid } = await pair();
    const admin = await rootSession();

    await admin.post('/mod/partner', { username: inviter.username, percent: 20 });
    await complete(await payment(referalUuid, 100));

    const before = await realOf(inviter.username);
    const outsider = await createUser({});

    const foreign = await outsider.session.post('/mod/partner/me/exchange', { amount: 5 });

    assert.equal(foreign.status, 403, 'обмен доступен не партнёру');

    const tooMuch = await inviter.session.post('/mod/partner/me/exchange', { amount: 999 });

    assert.equal(tooMuch.status, 400, 'обмен сверх остатка прошёл');
    assert.equal(await realOf(inviter.username), before, 'баланс изменился после отклонённого обмена');

    const exchange = await inviter.session.post('/mod/partner/me/exchange', { amount: 5 });

    assert.ok(ok(exchange.status), `обмен не прошёл: ${exchange.status} ${JSON.stringify(exchange.body)}`);
    assert.equal(await realOf(inviter.username), before + 5, 'деньги не попали на баланс сайта');

    const card = await admin.get(`/mod/partner/${inviterUuid}`).then((res) => res.body);

    assert.equal(Number(card.paid), 5, 'обмен не учтён как выполненная выплата');
    assert.equal(Number(card.available), 15, 'остаток не уменьшился после обмена');
  });

  it('выплата на баланс сайта закрывается сама', async () => {
    if (!(await paymentsDrivable())) return;

    const { inviter, inviterUuid, referalUuid } = await pair();
    const admin = await rootSession();

    await admin.post('/mod/partner', { username: inviter.username, percent: 20 });
    await complete(await payment(referalUuid, 100));

    const before = await realOf(inviter.username);
    const created = await admin.post(`/mod/partner/${inviterUuid}/payouts`, { amount: 8, kind: 'real' });

    assert.ok(ok(created.status), `выплата не создана: ${created.status} ${JSON.stringify(created.body)}`);
    assert.equal(created.body.status, 'done', 'выплата на баланс осталась в ожидании');
    assert.equal(await realOf(inviter.username), before + 8, 'деньги не пришли на баланс сайта');

    const card = await admin.get(`/mod/partner/${inviterUuid}`).then((res) => res.body);

    assert.equal(Number(card.pending), 0, 'выплата на баланс висит в ожидающих');
    assert.equal(Number(card.paid), 8, 'выплата на баланс не учтена как выполненная');
  });

  it('удаление партнёра уносит его начисления и выплаты', async () => {
    if (!(await paymentsDrivable())) return;

    const { inviter, inviterUuid, referalUuid } = await pair();
    const admin = await rootSession();

    await admin.post('/mod/partner', { username: inviter.username, percent: 20 });
    await complete(await payment(referalUuid, 100));
    await admin.post(`/mod/partner/${inviterUuid}/payouts`, { amount: 5, kind: 'requisites' });

    const { status } = await admin.del(`/mod/partner/${inviterUuid}`);

    assert.ok(ok(status), `партнёр не удалён: ${status}`);

    const accruals = await query('SELECT id FROM mod_partner_accruals WHERE partner_uuid = ?', [inviterUuid]);
    const payouts = await query('SELECT id FROM mod_partner_payouts WHERE partner_uuid = ?', [inviterUuid]);

    assert.equal(accruals.length, 0, 'начисления удалённого партнёра остались');
    assert.equal(payouts.length, 0, 'выплаты удалённого партнёра остались');
  });

  it('процент с пополнений не идёт активному партнёру и возвращается неактивному', async () => {
    const admin = await rootSession();
    const player = await createUser({});
    const uuid = await uuidOf(player.username);
    const percentKey = 'public_referal_payment_percent';
    const before = (await query('SELECT `value` FROM unicore_configs WHERE `key` = ?', [percentKey]))[0]?.value ?? '0';

    await admin.patch('/config', { key: percentKey, value: '5', type: 0 });

    try {
      const plain = await player.session.get('/cabinet/referals/me/percent');

      assert.equal(plain.body?.percent, 5, 'обычному игроку не достался процент ядра');
      assert.equal('rewards' in (plain.body || {}), false, 'ответ всё ещё несёт признак отключения наград');

      const created = await admin.post('/mod/partner', { username: player.username, percent: 10, terms: 'x', active: true });

      assert.ok(ok(created.status), `партнёр не создан: ${created.status}`);

      const active = await player.session.get('/cabinet/referals/me/percent');

      assert.equal(active.body?.percent, 0, 'активному партнёру остался процент ядра на баланс');

      await admin.patch(`/mod/partner/${uuid}`, { percent: 10, terms: 'x', active: false });

      const paused = await player.session.get('/cabinet/referals/me/percent');

      assert.equal(paused.body?.percent, 5, 'неактивному партнёру не вернулся процент ядра');

      await admin.del(`/mod/partner/${uuid}`);
    } finally {
      await admin.patch('/config', { key: percentKey, value: String(before), type: 0 });
    }
  });

  it('без права список партнёров закрыт', async () => {
    const { session } = await createAdmin([]);

    const { status } = await session.get('/mod/partner');

    assert.equal(status, 403, 'список партнёров открыт без права');
  });
});
