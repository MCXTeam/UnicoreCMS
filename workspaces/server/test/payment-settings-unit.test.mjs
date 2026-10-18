import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { compileSource } from './helpers/compile-source.mjs';

let directory, Settings, Exchange, parse, Quotes, minor;
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'unicore-rates-'));
  Settings = (await compileSource('payment/settings/payment-settings.service.ts', directory, 'settings')).PaymentSettingsService;
  const exchange = await compileSource('payment/settings/exchange-rates.service.ts', directory, 'exchange');
  Exchange = exchange.ExchangeRatesService; parse = exchange.parseCbrRates;
  const quotes = await compileSource('payment/methods/core/payment-quote.service.ts', directory, 'quotes');
  Quotes = quotes.PaymentQuoteService; minor = quotes.paymentMinor;
});
after(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });
function storage() {
  const rows = new Map();
  return { rows, async findOneBy({ id }) { return rows.get(id) || null; }, async save(row) { rows.set(row.id, { ...row }); return row; } };
}

describe('Настройки платёжных систем', () => {
  it('шифрует настройки и не возвращает секреты читателю', async () => {
    const repository = storage(); const settings = new Settings(repository);
    const result = await settings.updateGateway('platega', { enabled: true, values: { merchantId: 'shop', secret: 'fixture-secret' } });
    assert.ok(!repository.rows.get('platega').value.includes('fixture-secret'));
    assert.ok(!JSON.stringify(result).includes('fixture-secret'));
    assert.equal(result.values.secret, ''); assert.equal(result.configured.secret, true);
    assert.equal((await settings.gateway('platega')).values.secret, 'fixture-secret');
  });
  it('пустое поле сохраняет секрет, явное удаление разрешено для отключённой площадки', async () => {
    const settings = new Settings(storage());
    await settings.updateGateway('platega', { enabled: true, values: { merchantId: 'shop', secret: 'fixture-secret' } });
    await settings.updateGateway('platega', { enabled: true, values: { secret: '', currency: 'USD' } });
    assert.equal((await settings.gateway('platega')).values.secret, 'fixture-secret');
    await settings.updateGateway('platega', { enabled: false, values: {}, clearSecrets: ['secret'] });
    assert.equal((await settings.gateway('platega')).values.secret, '');
  });
  it('отклоняет неизвестные поля, неполные ключи и несовместимую валюту', async () => {
    const settings = new Settings(storage());
    await assert.rejects(settings.updateGateway('platega', { enabled: true, values: { merchantId: 'shop' } }));
    await assert.rejects(settings.updateGateway('platega', { enabled: false, values: { unexpected: 'value' } }));
    await assert.rejects(settings.updateGateway('yoomoney', { enabled: false, values: { currency: 'USD' } }));
    await assert.rejects(settings.updateGateway('webmoney', { enabled: true, values: { purse: 'Z123456789012', secret: 'secret', currency: 'RUB' } }));
    await assert.rejects(settings.gateway('nicepay'));
  });
  it('Tebex требует ключи выбранного режима, чеки требуют явных параметров', async () => {
    const settings = new Settings(storage());
    await assert.rejects(settings.updateGateway('tebex', { enabled: true, values: { mode: 'headless', privateKey: 'private', webhookSecret: 'secret' } }));
    await settings.updateGateway('tebex', { enabled: true, values: { mode: 'headless', privateKey: 'private', webhookSecret: 'secret', publicToken: 'token', categoryId: '12' } });
    await assert.rejects(settings.updateGateway('yookassa', { enabled: true, values: { shopId: 'shop', secret: 'secret', receipts: 'true' } }));
  });
  it('режим курсов и рублёвый номинал валидируются на сервере', async () => {
    const settings = new Settings(storage());
    for (const input of [
      { mode: 'unknown', baseCurrency: 'RUB', manualRates: { RUB: 1 } },
      { mode: 'manual', baseCurrency: 'USD', manualRates: { RUB: 1 } },
      { mode: 'manual', baseCurrency: 'RUB', manualRates: { RUB: 2 } },
      { mode: 'manual', baseCurrency: 'RUB', manualRates: { USD: 0 } },
    ]) await assert.rejects(settings.updateRates(input));
    const saved = await settings.updateRates({ mode: 'manual', baseCurrency: 'RUB', manualRates: { USD: 90 } });
    assert.equal(saved.manualRates.RUB, 1); assert.equal(saved.manualRates.USD, 90);
  });
});

describe('Курсы и снимок счёта', () => {
  const xml = '<ValCurs Date="17.10.2026"><Valute ID="USD"><CharCode>USD</CharCode><Nominal>1</Nominal><Value>90,5000</Value></Valute><Valute ID="DZD"><CharCode>DZD</CharCode><Nominal>100</Nominal><Value>62,2034</Value></Valute></ValCurs>';
  it('парсит дату ЦБ и делит значение на номинал', () => {
    const snapshot = parse(xml);
    assert.equal(snapshot.date, '17.10.2026'); assert.equal(snapshot.rates.USD, 90.5); assert.equal(snapshot.rates.DZD, 0.622034); assert.equal(snapshot.rates.RUB, 1);
    assert.throws(() => parse('<html>unavailable</html>'));
  });
  it('ручные курсы пересчитывают валюту и округляют счёт вверх до копейки', async () => {
    const exchange = new Exchange({ rates: async () => ({ mode: 'manual', baseCurrency: 'RUB', manualRates: { RUB: 1, USD: 90 } }) });
    const quote = await exchange.quote(100, 'USD');
    assert.equal(quote.amount, 1.12); assert.equal(quote.rate, 90); assert.equal(quote.baseCurrency, 'RUB');
    await assert.rejects(exchange.quote(100, 'EUR'));
    assert.equal((await exchange.quote(100, 'RUB')).amount, 100);
  });
  it('курс пересчитывается между двумя иностранными валютами через RUB', async () => {
    const exchange = new Exchange({ rates: async () => ({ mode: 'manual', baseCurrency: 'EUR', manualRates: { RUB: 1, USD: 90, EUR: 100 } }) });
    const quote = await exchange.quote(90, 'USD');
    assert.equal(quote.amount, 100); assert.equal(quote.rate, 0.9);
  });
  it('недавний снимок ЦБ используется без внешнего запроса', async () => {
    const snapshot = { date: '17.10.2026', fetchedAt: Date.now(), rates: { RUB: 1, USD: 90 } };
    const exchange = new Exchange({ read: async () => snapshot });
    assert.equal((await exchange.snapshot()).rates.USD, 90);
  });
  it('платёж сохраняет курс, а уведомление не пересчитывается по новым настройкам', async () => {
    let saved; let settled;
    const rows = new Map();
    const repository = { async update(id, values) { rows.set(id, { ...saved, ...values }); }, async findOneBy({ id, method }) { const row = rows.get(id); return row?.method === method ? row : null; } };
    const handler = { async create(method, amount, user, ip) { saved = { id: 42, method, amount, user, ip }; return saved; }, async handler(...args) { settled = args; return true; } };
    const quote = new Quotes({ gateway: async () => ({ values: { currency: 'USD' } }) }, { quote: async () => ({ amount: 10, currency: 'USD', rate: 90, baseCurrency: 'RUB', date: '17.10.2026' }) }, handler, repository);
    const result = await quote.create('tebex', 900, { uuid: 'player' }, '127.0.0.1');
    assert.equal(result.payment.exchange_rate, 90); assert.equal(result.amount, 10);
    assert.equal(await quote.settle('tebex', 42, 'txn', '10.00', 'USD'), true);
    assert.deepEqual(settled, [42, 'txn', 900, 'tebex']);
    assert.equal(await quote.settle('yookassa', 42, 'txn', 10, 'USD'), false);
    assert.equal(await quote.settle('tebex', 42, 'txn', 9.99, 'USD'), false);
    assert.equal(await quote.settle('tebex', 42, 'txn', 10, 'EUR'), false);
  });
  it('суммы не принимают NaN, экспоненты, отрицательные и лишние десятичные знаки', () => {
    for (const value of [NaN, Infinity, '-1', '1e2', '1.001', true, [], {}, null, '']) assert.equal(minor(value), null);
    assert.equal(minor('10.000000'), 1000); assert.equal(minor('0.10'), 10);
  });
});
