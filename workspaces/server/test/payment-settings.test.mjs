import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createHash } from 'node:crypto';
import { api } from './helpers/env.mjs';
import { query, closeDatabase } from './helpers/db.mjs';
import { rootSession, createAdmin, createUser, cleanup } from './helpers/stand.mjs';

after(async () => { await cleanup(); await closeDatabase(); });

test('payment settings permissions, encrypted secrets and immutable concurrent settlement', async () => {
  const saved = await query('SELECT * FROM unicore_payment_settings');
  const admin = await rootSession();
  const secret = 'fixture-payment-secret-2026';
  let paymentId;
  try {
    const reader = await createAdmin(['panel.config.read']);
    const denied = await createAdmin([]);
    assert.equal((await denied.session.get('/admin/payment-settings')).status, 403);
    assert.equal((await reader.session.get('/admin/payment-settings')).status, 200);
    assert.equal((await reader.session.patch('/admin/payment-settings/rates', { mode: 'manual', baseCurrency: 'RUB', manualRates: { RUB: 1, USD: 90 } })).status, 403);
    assert.equal((await admin.patch('/admin/payment-settings/rates', { mode: 'manual', baseCurrency: 'RUB', manualRates: { RUB: 1, USD: 90 } })).status, 200);
    const settings = await admin.patch('/admin/payment-settings/webmoney', { enabled: true, values: { currency: 'USD', purse: 'Z123456789012', secret } });
    assert.equal(settings.status, 200);
    assert.equal(settings.body.values.secret, '');
    assert.equal(settings.body.configured.secret, true);
    assert.equal(JSON.stringify((await admin.get('/admin/payment-settings')).body).includes(secret), false);
    assert.equal((await query('SELECT value FROM unicore_payment_settings WHERE id = ?', ['webmoney']))[0].value.includes(secret), false);
    const user = await createUser({ perms: ['player.payment'] });
    const [{ uuid, balance: before }] = await query('SELECT uuid, `real` AS balance FROM unicore_users WHERE username = ?', [user.username]);
    const link = await user.session.post('/payment/methods/webmoney/link', { amount: 900 });
    assert.equal(link.status, 201, JSON.stringify(link.body));
    const [payment] = await query('SELECT * FROM unicore_payments WHERE user_uuid = ? ORDER BY id DESC LIMIT 1', [uuid]);
    paymentId = payment.id;
    assert.equal(Number(payment.provider_amount), 10);
    assert.equal(payment.provider_currency, 'USD');
    const bridge = await fetch(link.body.link);
    assert.equal(bridge.status, 200);
    const html = await bridge.text();
    assert.match(html, /value="10.00"/);
    assert.equal(html.includes(secret), false);
    await admin.patch('/admin/payment-settings/rates', { mode: 'manual', baseCurrency: 'RUB', manualRates: { RUB: 1, USD: 180 } });
    await admin.patch('/admin/payment-settings/webmoney', { enabled: false, values: { secret: '' } });
    const body = { LMI_PAYEE_PURSE: 'Z123456789012', LMI_PAYMENT_AMOUNT: '10.00', LMI_PAYMENT_NO: String(payment.id), LMI_MODE: '0', LMI_SYS_INVS_NO: '123', LMI_SYS_TRANS_NO: `fixture-${payment.id}`, LMI_SYS_TRANS_DATE: '20261018 00:00:00', LMI_PAYER_PURSE: 'Z987654321012', LMI_PAYER_WM: '123456789012' };
    body.LMI_HASH = createHash('sha256').update([body.LMI_PAYEE_PURSE, body.LMI_PAYMENT_AMOUNT, body.LMI_PAYMENT_NO, body.LMI_MODE, body.LMI_SYS_INVS_NO, body.LMI_SYS_TRANS_NO, body.LMI_SYS_TRANS_DATE, secret, body.LMI_PAYER_PURSE, body.LMI_PAYER_WM].join('')).digest('hex').toUpperCase();
    const notify = (values) => fetch(`${api}/payment/methods/webmoney/handler`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(values) });
    assert.equal((await notify({ ...body, LMI_PAYMENT_AMOUNT: '11.00' })).status, 400);
    const replies = await Promise.all(Array.from({ length: 5 }, () => notify(body)));
    assert.deepEqual(replies.map((item) => item.status), [200, 200, 200, 200, 200]);
    const [{ balance }] = await query('SELECT `real` AS balance FROM unicore_users WHERE uuid = ?', [uuid]);
    const [{ bonus }] = await query('SELECT bonus FROM unicore_bonuses WHERE amount <= 900 ORDER BY amount DESC LIMIT 1').then((rows) => rows.length ? rows : [{ bonus: 0 }]);
    assert.equal(Number(balance) - Number(before), 900 + 900 * Number(bonus) / 100);
    const [settled] = await query('SELECT * FROM unicore_payments WHERE id = ?', [payment.id]);
    assert.equal(Number(settled.amount), 900);
    assert.equal(Number(settled.exchange_rate), 90);
  } finally {
    if (paymentId) await query('DELETE FROM unicore_payments WHERE id = ?', [paymentId]);
    await query('DELETE FROM unicore_payment_settings');
    for (const row of saved) await query('INSERT INTO unicore_payment_settings (id,value) VALUES (?,?)', [row.id, row.value]);
  }
});
