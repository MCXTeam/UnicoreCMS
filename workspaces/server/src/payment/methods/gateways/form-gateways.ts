import { randomUUID } from 'node:crypto';
import { Gateway, assertGateway, decimal, description, equal, fieldsOnly, hash, hmac, rfc3986 } from './protocol';

export function freekassa(config: Record<string, string>): Gateway {
  const ips = ['168.119.157.136', '168.119.60.227', '178.154.197.79', '51.250.54.238'];
  return {
    async create(context) {
      const amount = decimal(context);
      const fields = { m: config.merchantId, oa: amount, currency: context.payment.provider_currency, o: String(context.payment.id), em: context.user.email || '' };
      const url = new URL('https://pay.fk.money/');
      for (const [key, value] of Object.entries(fields)) url.searchParams.set(key, value);
      url.searchParams.set('s', hash('md5', [fields.m, amount, config.secret, fields.currency, fields.o].join(':')));
      return { link: url.href };
    },
    async verify(request) {
      const body = fieldsOnly(request.body);
      assertGateway(ips.includes(request.ip.replace(/^::ffff:/, '')) && body.MERCHANT_ID === config.merchantId);
      assertGateway(equal(body.SIGN?.toLowerCase(), hash('md5', [body.MERCHANT_ID, body.AMOUNT, config.secretSecond, body.MERCHANT_ORDER_ID].join(':'))));
      assertGateway(body.intid);
      return { orderId: body.MERCHANT_ORDER_ID, transactionId: body.intid, amount: body.AMOUNT, currency: body.currency, paid: true, response: 'YES' };
    },
  };
}

export function yoomoney(config: Record<string, string>): Gateway {
  return {
    async create(context) {
      const id = randomUUID();
      return { id, link: context.form(id) };
    },
    form(context) {
      return { action: 'https://yoomoney.ru/quickpay/confirm', fields: {
        receiver: config.receiver, 'quickpay-form': 'button', paymentType: 'AC', sum: decimal(context),
        label: String(context.payment.id), successURL: context.success,
      } };
    },
    async verify(request) {
      const body = fieldsOnly(request.body);
      const { sign, ...values } = body;
      const canonical = Object.keys(values).sort().map((key) => `${key}=${rfc3986(values[key])}`).join('&');
      assertGateway(equal(sign, hmac(canonical, config.secret)));
      assertGateway(['p2p-incoming', 'card-incoming'].includes(body.notification_type) && body.currency === '643');
      assertGateway(body.codepro === 'false' && body.unaccepted === 'false' && body.operation_id);
      return { orderId: body.label, transactionId: body.operation_id, amount: body.withdraw_amount, currency: 'RUB', paid: true };
    },
  };
}

export function webmoney(config: Record<string, string>): Gateway {
  return {
    async create(context) {
      const id = randomUUID();
      return { id, link: context.form(id) };
    },
    form(context) {
      const fields: Record<string, string> = {
        LMI_PAYEE_PURSE: config.purse, LMI_PAYMENT_AMOUNT: decimal(context), LMI_PAYMENT_NO: String(context.payment.id),
        LMI_PAYMENT_DESC_BASE64: Buffer.from(description(context)).toString('base64'), LMI_SIM_MODE: '0',
      };
      if (config.formSecret) fields.LMI_PAYMENTFORM_SIGN = hash('sha256', [config.purse, fields.LMI_PAYMENT_AMOUNT, fields.LMI_PAYMENT_NO, config.formSecret, ''].join(';')).toUpperCase();
      return { action: 'https://merchant.webmoney.com/lmi/payment_utf.asp', fields };
    },
    async verify(request) {
      const body = fieldsOnly(request.body);
      assertGateway(body.LMI_PAYEE_PURSE === config.purse && body.LMI_FAILREQUEST !== '1' && (!body.LMI_HOLD || body.LMI_HOLD === '0'));
      if (body.LMI_PREREQUEST === '1') return { orderId: body.LMI_PAYMENT_NO, amount: body.LMI_PAYMENT_AMOUNT, currency: config.currency, prerequest: true, response: 'YES' };
      assertGateway(body.LMI_MODE === '0' && body.LMI_SYS_TRANS_NO);
      const values = [body.LMI_PAYEE_PURSE, body.LMI_PAYMENT_AMOUNT, body.LMI_PAYMENT_NO, body.LMI_MODE, body.LMI_SYS_INVS_NO, body.LMI_SYS_TRANS_NO, body.LMI_SYS_TRANS_DATE, config.secret, body.LMI_PAYER_PURSE, body.LMI_PAYER_WM];
      assertGateway(values.every((value) => typeof value === 'string'));
      const valid = body.LMI_HASH2
        ? equal(body.LMI_HASH2.toUpperCase(), hash('sha256', (body.LMI_HOLD ? [...values.slice(0, 2), body.LMI_HOLD, ...values.slice(2)] : values).join(';')).toUpperCase())
        : equal(body.LMI_HASH?.toUpperCase(), hash('sha256', values.join('')).toUpperCase());
      assertGateway(valid);
      return { orderId: body.LMI_PAYMENT_NO, transactionId: body.LMI_SYS_TRANS_NO, amount: body.LMI_PAYMENT_AMOUNT, currency: config.currency, paid: true };
    },
  };
}
