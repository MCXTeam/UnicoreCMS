import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { compileSource } from './helpers/compile-source.mjs';

let directory, invoices, forms, tebexFactory;
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'unicore-gateway-'));
  invoices = await compileSource('payment/methods/gateways/invoice-gateways.ts', directory, 'invoices');
  forms = await compileSource('payment/methods/gateways/form-gateways.ts', directory, 'forms');
  tebexFactory = (await compileSource('payment/methods/gateways/tebex.ts', directory, 'tebex')).tebex;
});
after(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });
const config = { merchantId: 'merchant', secret: 'test-api-secret', salt: 'test-salt', login: 'cashbox', shopId: 'shop', publicId: 'public', additionalKey: 'test-webhook-secret', currency: 'RUB', test: 'false', receipts: 'false', receiver: '4100000000000', purse: 'Z123456789012', projectId: 'project', privateKey: 'private', publicToken: 'token', categoryId: '12', mode: 'checkout', webhookSecret: 'tebex-secret', secretSecond: 'secret-two' };
const context = () => ({ payment: { id: 42, amount: 900, provider_amount: 10, provider_currency: 'RUB', provider_id: 'invoice' }, user: { uuid: 'player-id', username: 'Steve', email: 'steve@example.com' }, ip: '127.0.0.1', callback: 'https://cms.test/handler', success: 'https://cms.test/success', fail: 'https://cms.test/fail', resume: (id) => `https://cms.test/resume/${id}`, form: (id) => `https://cms.test/form/${id}` });
const sha = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
const mac = (value, secret, encoding = 'hex') => createHmac('sha256', secret).update(value).digest(encoding);
const request = (body, headers = {}, raw = JSON.stringify(body)) => ({ body, headers, raw: Buffer.from(raw), ip: '51.250.54.238' });
const noHttp = async () => { throw new Error('Unexpected HTTP request'); };

describe('Создание счетов по контрактам провайдеров', () => {
  const expected = {
    platega: ['https://app.platega.io/v2/transaction/process', { transactionId: 'uuid', url: 'https://pay.test/42' }],
    crystalpay: ['https://api.crystalpay.io/v3/invoice/create/', { error: false, id: 'invoice', url: 'https://pay.test/42' }],
    heleket: ['https://api.heleket.com/v1/payment', { state: 0, result: { uuid: 'uuid', url: 'https://pay.test/42' } }],
    yookassa: ['https://api.yookassa.ru/v3/payments', { id: 'uuid', test: false, confirmation: { confirmation_url: 'https://pay.test/42' } }],
    cloudpayments: ['https://api.cloudpayments.ru/orders/create', { Success: true, Model: { Id: 'order', Url: 'https://pay.test/42' } }],
    lava: ['https://api.lava.ru/business/invoice/create', { status_check: true, status: 200, data: { id: 'uuid', url: 'https://pay.test/42' } }],
  };
  for (const name of Object.keys(expected)) it(`${name}: сумма берётся из зафиксированного валютного счёта`, async () => {
    const [url, response] = expected[name];
    const result = await invoices[name](config).create(context(), async (method, actual, data, headers) => {
      assert.equal(method, 'POST'); assert.equal(actual, url);
      const body = typeof data === 'string' ? JSON.parse(data) : data;
      const amount = name === 'platega' ? body.paymentDetails.amount : name === 'yookassa' ? body.amount.value : name === 'lava' ? body.sum : name === 'cloudpayments' ? body.Amount : body.amount;
      assert.equal(Number(amount), 10);
      if (name === 'crystalpay') { assert.equal(body.type, 'purchase'); assert.equal(body.currency, 'RUB'); }
      if (name === 'yookassa') { assert.equal(body.capture, true); assert.equal(headers['Idempotence-Key'], 'unicore-42'); }
      if (name === 'heleket') assert.equal(headers.sign, sha('md5', Buffer.from(data).toString('base64') + config.secret));
      if (name === 'lava') assert.equal(headers.Signature, mac(data, config.secret));
      return response;
    });
    assert.equal(result.link, 'https://pay.test/42');
    assert.ok(result.id);
  });
  it('отклоняет ошибку API даже при HTTP 200 и опасный checkout URL', async () => {
    await assert.rejects(invoices.crystalpay(config).create(context(), async () => ({ error: true, id: 'x', url: 'https://pay.test' })));
    await assert.rejects(invoices.platega(config).create(context(), async () => ({ transactionId: 'x', url: 'javascript:alert(1)' })));
  });
  it('FreeKassa использует текущий hosted URL и подписывает валюту и сумму', async () => {
    const result = await forms.freekassa(config).create(context(), noHttp);
    const url = new URL(result.link);
    assert.equal(url.origin, 'https://pay.fk.money');
    assert.equal(url.searchParams.get('s'), sha('md5', 'merchant:10.00:test-api-secret:RUB:42'));
  });
  it('ЮMoney и WebMoney возвращают серверную POST-форму без секретов', async () => {
    for (const name of ['yoomoney', 'webmoney']) {
      const adapter = forms[name](config);
      const result = await adapter.create(context(), noHttp);
      assert.ok(result.id && result.link.startsWith('https://cms.test/form/'));
      const form = adapter.form(context());
      assert.equal(Number(form.fields.sum || form.fields.LMI_PAYMENT_AMOUNT), 10);
      assert.ok(!JSON.stringify(form).includes(config.secret));
    }
  });
});

describe('Подписи и авторитетное подтверждение оплаты', () => {
  it('CrystalPay не доверяет state/amount из callback, подписывающего только id', async () => {
    const body = { id: 'invoice', signature: sha('sha1', 'invoice:test-salt'), state: 'payed', amount: 10000, extra: '99' };
    const result = await invoices.crystalpay(config).verify(request(body), async () => ({ error: false, id: 'invoice', type: 'purchase', state: 'processing', amount: 10, currency: 'RUB', extra: '42' }));
    assert.equal(result.paid, false); assert.equal(result.orderId, '42'); assert.equal(result.amount, 10);
    await assert.rejects(invoices.crystalpay(config).verify(request({ ...body, signature: 'wrong' }), noHttp));
  });
  it('ЮKassa проверяет магазин и не зачисляет waiting_for_capture', async () => {
    const payload = request({ type: 'notification', event: 'payment.succeeded', object: { id: 'invoice' } });
    const info = { id: 'invoice', recipient: { account_id: 'shop' }, metadata: { order_id: '42' }, amount: { value: '10.00', currency: 'RUB' }, paid: true, status: 'waiting_for_capture', test: false };
    assert.equal((await invoices.yookassa(config).verify(payload, async () => info)).paid, false);
    await assert.rejects(invoices.yookassa(config).verify(payload, async () => ({ ...info, recipient: { account_id: 'another-shop' } })));
    await assert.rejects(invoices.yookassa(config).verify(payload, async () => ({ ...info, test: true })));
  });
  it('Platega проверяет оба заголовка и статус через API', async () => {
    const payload = request({ id: 'invoice', status: 'CONFIRMED' }, { 'x-merchantid': 'merchant', 'x-secret': config.secret });
    const result = await invoices.platega(config).verify(payload, async () => ({ id: 'invoice', status: 'PENDING', payload: '42', paymentDetails: { amount: 10, currency: 'RUB' } }));
    assert.equal(result.paid, false);
    await assert.rejects(invoices.platega(config).verify({ ...payload, headers: {} }, noHttp));
  });
  it('CloudPayments проверяет encoded Content-HMAC и completed Payment через API', async () => {
    const raw = 'TransactionId=123&InvoiceId=42&Name=%D0%A2%D0%B5%D1%81%D1%82+User';
    const info = { Success: true, Model: { TransactionId: 123, InvoiceId: '42', AccountId: 'player-id', TestMode: false, Status: 'Completed', OperationType: 'Payment', Amount: 10, Currency: 'RUB' } };
    const result = await invoices.cloudpayments(config).verify(request({ TransactionId: '123' }, { 'content-hmac': mac(raw, config.secret, 'base64') }, raw), async () => info);
    assert.equal(result.paid, true); assert.deepEqual(result.response, { code: 0 });
    await assert.rejects(invoices.cloudpayments(config).verify(request({ TransactionId: '123' }, { 'content-hmac': mac(decodeURIComponent(raw.replace(/\+/g, ' ')), config.secret, 'base64') }, raw), noHttp));
    const decoded = await invoices.cloudpayments(config).verify(request({ TransactionId: '123' }, { 'x-content-hmac': mac(decodeURIComponent(raw.replace(/\+/g, ' ')), config.secret, 'base64') }, raw), async () => info);
    assert.equal(decoded.paid, true);
  });
  it('Heleket принимает подпись PHP JSON и paid_over, но сверяет invoice через API', async () => {
    const body = { uuid: 'invoice', order_id: '42', status: 'paid', additional_data: 'https://cms.test/42' };
    body.sign = sha('md5', Buffer.from(JSON.stringify(body).replace(/\//g, '\\/')).toString('base64') + config.secret);
    const result = await invoices.heleket(config).verify(request(body), async () => ({ state: 0, result: { uuid: 'invoice', order_id: '42', amount: '10.00', currency: 'RUB', payment_status: 'paid_over' } }));
    assert.equal(result.paid, true);
    await assert.rejects(invoices.heleket(config).verify(request({ ...body, order_id: '99' }), noHttp));
  });
  it('Lava проверяет дополнительный ключ и запрашивает статус', async () => {
    const body = { invoice_id: 'invoice', order_id: '42', amount: 10, status: 'success' };
    const raw = JSON.stringify(body);
    const payload = request(body, { signature: mac(raw, config.additionalKey) }, raw);
    const result = await invoices.lava(config).verify(payload, async () => ({ status_check: true, status: 200, data: { id: 'invoice', shop_id: 'shop', order_id: '42', amount: 10, status: 'created' } }));
    assert.equal(result.paid, false);
    await assert.rejects(invoices.lava(config).verify(request(body, { signature: mac(raw, config.secret) }, raw), noHttp));
  });
  it('ЮMoney sign совпадает с официальным вектором; учитывает полную списанную сумму', async () => {
    const body = { notification_type: 'p2p-incoming', operation_id: '441361714955017004', amount: '98.00', withdraw_amount: '100.00', currency: '643', datetime: '2013-12-26T08:28:34Z', sender: '41000000000', codepro: 'false', label: 'ML23045', unaccepted: 'false', sha1_hash: 'ac13833bd6ba9eff1fa9e4bed76f3d6ebb57f6c0', sign: 'a452af731650e2c5b39abcdc7c28dd27db7b3b654c2230ad2c386e64afb98605' };
    const result = await forms.yoomoney({ ...config, secret: 'secret123' }).verify(request(body), noHttp);
    assert.equal(result.amount, '100.00');
    await assert.rejects(forms.yoomoney({ ...config, secret: 'secret123' }).verify(request({ ...body, label: '42' }), noHttp));
  });
  it('FreeKassa подтверждает YES и отклоняет чужой магазин, подпись и IP', async () => {
    const body = { MERCHANT_ID: 'merchant', AMOUNT: '10.00', MERCHANT_ORDER_ID: '42', intid: '123', SIGN: sha('md5', 'merchant:10.00:secret-two:42') };
    const result = await forms.freekassa(config).verify(request(body), noHttp);
    assert.equal(result.response, 'YES');
    await assert.rejects(forms.freekassa(config).verify({ ...request(body), ip: '127.0.0.1' }, noHttp));
    await assert.rejects(forms.freekassa(config).verify(request({ ...body, MERCHANT_ID: 'another' }), noHttp));
  });
  it('WebMoney prerequest не оплачивает счёт; финал требует SHA256 и режим 0', async () => {
    const body = { LMI_PAYEE_PURSE: config.purse, LMI_PAYMENT_AMOUNT: '10.00', LMI_PAYMENT_NO: '42', LMI_MODE: '0', LMI_SYS_INVS_NO: '123', LMI_SYS_TRANS_NO: '456', LMI_SYS_TRANS_DATE: '20261018 12:00:00', LMI_PAYER_PURSE: 'Z111111111111', LMI_PAYER_WM: '111111111111' };
    const fields = ['LMI_PAYEE_PURSE', 'LMI_PAYMENT_AMOUNT', 'LMI_PAYMENT_NO', 'LMI_MODE', 'LMI_SYS_INVS_NO', 'LMI_SYS_TRANS_NO', 'LMI_SYS_TRANS_DATE'];
    body.LMI_HASH = sha('sha256', [...fields.map(key => body[key]), config.secret, body.LMI_PAYER_PURSE, body.LMI_PAYER_WM].join('')).toUpperCase();
    assert.equal((await forms.webmoney(config).verify(request(body), noHttp)).paid, true);
    assert.equal((await forms.webmoney(config).verify(request({ ...body, LMI_PREREQUEST: '1' }), noHttp)).prerequest, true);
    await assert.rejects(forms.webmoney(config).verify(request({ ...body, LMI_MODE: '1' }), noHttp));
  });
});

describe('Tebex: Checkout и Headless', () => {
  it('Checkout создаёт один товар с локальной привязкой и произвольной ценой', async () => {
    const result = await tebexFactory(config).create(context(), async (method, url, data) => {
      assert.equal(url, 'https://checkout.tebex.io/api/checkout');
      assert.equal(data.items[0].package.price, 10); assert.equal(data.items[0].package.custom.orderId, '42');
      return { ident: 'basket', links: { checkout: 'https://checkout.test/basket' } };
    });
    assert.equal(result.data.mode, 'checkout');
  });
  it('Headless создаёт dynamic package и запрашивает его ident перед добавлением', async () => {
    const calls = [];
    const basket = { ident: 'basket', currency: 'RUB', username_id: 'minecraft-id', username: 'Steve' };
    const result = await tebexFactory({ ...config, mode: 'headless' }).create(context(), async (method, url, body) => {
      calls.push({ method, url, body });
      if (url.endsWith('/baskets') && method === 'POST') return { data: basket };
      if (url.includes('/auth?')) return [];
      if (url.endsWith('/dynamic-packages')) return { message: 'Dynamic packages updated successfully.' };
      if (url.includes('/categories/')) return { data: { packages: [{ id: 10, ident: 'dyn_12_10', slug: 'unicore-42' }] } };
      if (url.endsWith('/packages')) return {};
      return { data: { ...basket, base_price: 10, packages: [{ id: 10, in_basket: { quantity: 1 } }], links: { checkout: 'https://checkout.test/headless' } } };
    });
    assert.equal(result.data.packageId, '10');
    assert.equal(calls.find(item => item.url.endsWith('/packages')).body.dynamic, true);
    assert.ok(calls.some(item => item.url.endsWith('/dynamic-packages') && item.method === 'PUT'));
  });
  it('Headless сначала отправляет на внешнюю авторизацию и не добавляет товар', async () => {
    const result = await tebexFactory({ ...config, mode: 'headless' }).create(context(), async (method, url) => {
      if (url.endsWith('/baskets')) return { data: { ident: 'basket', currency: 'RUB' } };
      if (url.includes('/auth?')) return [{ name: 'external', url: 'https://auth.test/player' }];
      throw new Error('package creation before auth');
    });
    assert.equal(result.link, 'https://auth.test/player');
  });
  it('повторный Headless resume находит товар по slug без недокументированного custom', async () => {
    const basket = { ident: 'basket', currency: 'RUB', username_id: 123, base_price: 10, packages: [{ id: 10, slug: 'unicore-42', in_basket: { quantity: 1 } }], links: { checkout: 'https://checkout.test/headless' } };
    const ctx = context();
    ctx.payment.provider_id = 'basket';
    const result = await tebexFactory({ ...config, mode: 'headless' }).resume(ctx, async (method, url) => {
      assert.equal(method, 'GET');
      return url.includes('/auth?') ? [] : { data: basket };
    });
    assert.equal(result.data.packageId, '10');
  });
  it('проверяет подпись исходных байтов, validation и цену товара без налога', async () => {
    const adapter = tebexFactory(config);
    const body = { id: 'event', type: 'payment.completed', subject: { status: { id: 1 }, transaction_id: 'tbx-1', price_paid: { amount: 12, currency: 'RUB' }, products: [{ id: 10, quantity: 1, custom: { orderId: '42' }, paid_price: { amount: 10, currency: 'RUB' } }] } };
    const raw = JSON.stringify(body, null, 2);
    const result = await adapter.verify(request(body, { 'x-signature': mac(sha('sha256', raw), config.webhookSecret) }, raw), noHttp);
    assert.equal(result.amount, 10); assert.equal(result.paid, true);
    await assert.rejects(adapter.verify(request(body, { 'x-signature': mac(sha('sha256', JSON.stringify(body)), config.webhookSecret) }, raw), noHttp));
    const validation = { id: 'event', type: 'validation.webhook', subject: {} };
    const bytes = JSON.stringify(validation);
    assert.deepEqual((await adapter.verify(request(validation, { 'x-signature': mac(sha('sha256', bytes), config.webhookSecret) }, bytes), noHttp)).response, { id: 'event' });
  });
});
