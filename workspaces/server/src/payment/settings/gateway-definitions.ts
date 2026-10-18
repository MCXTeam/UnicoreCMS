export interface GatewayField {
  key: string;
  env: string;
  secret?: boolean;
  required?: boolean;
  default?: string;
  options?: string[];
}

export interface GatewayDefinition {
  id: string;
  name: string;
  prefix: string;
  docs: string;
  fields: GatewayField[];
  currencies?: string[];
}

const field = (key: string, env: string, secret = false, required = true, value = ''): GatewayField =>
  ({ key, env, secret, required, default: value });

const currency: GatewayField = { key: 'currency', env: 'CURRENCY', default: 'RUB', required: true };
const test: GatewayField = { key: 'test', env: 'TEST', default: 'false', options: ['false', 'true'] };
const receipt = [
  { key: 'receipts', env: 'RECEIPTS', default: 'false', options: ['false', 'true'] },
  field('vat', 'VAT', false, false),
  field('taxSystem', 'TAX_SYSTEM', false, false),
  field('paymentSubject', 'PAYMENT_SUBJECT', false, false),
  field('paymentMode', 'PAYMENT_MODE', false, false),
];

export const GATEWAYS: GatewayDefinition[] = [
  { id: 'platega', name: 'Platega', prefix: 'PLATEGA', docs: 'https://docs.platega.io/', fields: [field('merchantId', 'MERCHANT_ID'), field('secret', 'SECRET', true), currency] },
  { id: 'crystalpay', name: 'CrystalPay', prefix: 'CRYSTALPAY', docs: 'https://docs.crystalpay.io/', fields: [field('login', 'LOGIN'), field('secret', 'SECRET', true), field('salt', 'SALT', true), currency] },
  { id: 'yookassa', name: 'ЮKassa', prefix: 'YOOKASSA', docs: 'https://yookassa.ru/developers/', fields: [field('shopId', 'SHOP_ID'), field('secret', 'SECRET', true), currency, test, ...receipt] },
  { id: 'heleket', name: 'Heleket', prefix: 'HELEKET', docs: 'https://doc.heleket.com/', fields: [field('merchantId', 'MERCHANT_ID'), field('secret', 'SECRET', true), currency] },
  { id: 'tebex', name: 'Tebex', prefix: 'TEBEX', docs: 'https://docs.tebex.io/developers/', fields: [
    { key: 'mode', env: 'MODE', default: 'checkout', options: ['checkout', 'headless'], required: true },
    field('projectId', 'PROJECT_ID', false, false), field('privateKey', 'PRIVATE_KEY', true),
    field('publicToken', 'PUBLIC_TOKEN', false, false), field('categoryId', 'CATEGORY_ID', false, false),
    field('webhookSecret', 'WEBHOOK_SECRET', true), currency,
  ] },
  { id: 'cloudpayments', name: 'CloudPayments', prefix: 'CLOUDPAYMENTS', docs: 'https://developers.cloudpayments.ru/', fields: [field('publicId', 'PUBLIC_ID'), field('secret', 'SECRET', true), currency, test, ...receipt] },
  { id: 'lava', name: 'Lava Business', prefix: 'LAVA', docs: 'https://developer.lava.ru/', fields: [field('shopId', 'SHOP_ID'), field('secret', 'SECRET', true), field('additionalKey', 'ADDITIONAL_KEY', true), currency] },
  { id: 'webmoney', name: 'WebMoney', prefix: 'WEBMONEY', docs: 'https://ru.webmoney.wiki/projects/webmoney/wiki/web_merchant_interface', fields: [field('purse', 'PURSE'), field('secret', 'SECRET', true), field('formSecret', 'FORM_SECRET', true, false), currency] },
  { id: 'yoomoney', name: 'ЮMoney', prefix: 'YOOMONEY', docs: 'https://yoomoney.ru/docs/payment-buttons/using-api/notifications', currencies: ['RUB'], fields: [field('receiver', 'RECEIVER'), field('secret', 'SECRET', true), currency] },
  { id: 'freekassa', name: 'FreeKassa', prefix: 'FREEKASSA', docs: 'https://docs.freekassa.net/', fields: [field('merchantId', 'MERCHANT_ID'), field('secret', 'SECRET_KEY', true), field('secretSecond', 'SECRET_KEY_SECOND', true), currency] },
  { id: 'anypay', name: 'AnyPay', prefix: 'ANYPAY', docs: 'https://anypay.io/doc', currencies: ['RUB'], fields: [field('merchantId', 'MERCHANT_ID'), field('secret', 'SECRET_KEY', true), currency] },
  { id: 'centapp', name: 'CentApp', prefix: 'CENTAPP', docs: 'https://cent.app/', currencies: ['RUB'], fields: [field('shopId', 'SHOP_ID'), field('secret', 'TOKEN', true), currency] },
  { id: 'enotio', name: 'EnotIO', prefix: 'ENOTIO', docs: 'https://docs.enot.io/', currencies: ['RUB'], fields: [field('merchantId', 'MERCHANT_ID'), field('secret', 'SECRET_KEY', true), field('secretSecond', 'SECRET_KEY_SECOND', true), currency] },
  { id: 'payok', name: 'PayOk', prefix: 'PAYOK', docs: 'https://payok.io/cabinet/documentation/doc_api_main', currencies: ['RUB'], fields: [field('shopId', 'SHOP_ID'), field('secret', 'SECRET_KEY', true), currency] },
  { id: 'unitpay', name: 'UnitPay', prefix: 'UNITPAY', docs: 'https://help.unitpay.ru/', currencies: ['RUB'], fields: [field('publicId', 'PUBLIC_KEY'), field('secret', 'SECRET_KEY', true), currency] },
];

export const LEGACY_GATEWAY_IDS = ['anypay', 'centapp', 'enotio', 'payok', 'unitpay'];

export interface GatewaySettings {
  enabled: boolean;
  values: Record<string, string>;
}

export interface RateSettings {
  mode: 'manual' | 'cbr';
  baseCurrency: string;
  manualRates: Record<string, number>;
}

export const DEFAULT_RATES: RateSettings = { mode: 'cbr', baseCurrency: 'RUB', manualRates: { RUB: 1 } };

export function gatewayDefaults(definition: GatewayDefinition, source: NodeJS.ProcessEnv = process.env): GatewaySettings {
  return {
    enabled: ['true', '1'].includes(String(source[`${definition.prefix}_ENABLED`] || '').toLowerCase()),
    values: Object.fromEntries(definition.fields.map((item) => [item.key, source[`${definition.prefix}_${item.env}`] ?? item.default ?? ''])),
  };
}
