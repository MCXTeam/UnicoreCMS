import { Gateway, GatewayHttp, assertGateway, basic, checkoutUrl, decimal, description, equal, hash, hmac, phpJson, sorted } from './protocol';

export function platega(config: Record<string, string>): Gateway {
  const headers = { 'X-MerchantId': config.merchantId, 'X-Secret': config.secret };
  return {
    async create(context, http) {
      const result = await http('POST', 'https://app.platega.io/v2/transaction/process', {
        paymentDetails: { amount: Number(decimal(context)), currency: context.payment.provider_currency },
        description: description(context), return: context.success, failedUrl: context.fail,
        orderId: String(context.payment.id), payload: String(context.payment.id),
        metadata: { userId: context.user.uuid, userName: context.user.username },
      }, headers);
      assertGateway(result.transactionId);
      return { id: String(result.transactionId), link: checkoutUrl(result.url) };
    },
    async verify(request, http) {
      assertGateway(equal(request.headers['x-merchantid'], config.merchantId) && equal(request.headers['x-secret'], config.secret));
      assertGateway(typeof request.body.id === 'string');
      const result = await http('GET', `https://app.platega.io/transaction/${encodeURIComponent(request.body.id)}`, undefined, headers);
      assertGateway(result.id === request.body.id);
      return { providerId: result.id, transactionId: result.id, orderId: result.payload, amount: result.paymentDetails?.amount, currency: result.paymentDetails?.currency, paid: result.status === 'CONFIRMED' };
    },
  };
}

export function crystalpay(config: Record<string, string>): Gateway {
  const send = async (http: GatewayHttp, path: string, data: Record<string, unknown>) => {
    const result = await http('POST', `https://api.crystalpay.io/v3/invoice/${path}/`, { auth_login: config.login, auth_secret: config.secret, ...data });
    assertGateway(result.error === false);
    return result;
  };
  return {
    async create(context, http) {
      const result = await send(http, 'create', {
        amount: Number(decimal(context)), currency: context.payment.provider_currency, type: 'purchase', lifetime: 60,
        subtract_from: 'amount', extra: String(context.payment.id), description: description(context),
        redirect_url: context.success, callback_url: context.callback,
      });
      assertGateway(result.id);
      return { id: String(result.id), link: checkoutUrl(result.url) };
    },
    async verify(request, http) {
      assertGateway(typeof request.body.id === 'string' && equal(request.body.signature, hash('sha1', `${request.body.id}:${config.salt}`)));
      const result = await send(http, 'info', { id: request.body.id });
      assertGateway(result.id === request.body.id && result.type === 'purchase');
      return { providerId: result.id, transactionId: result.id, orderId: String(result.extra), amount: result.amount, currency: result.currency, paid: result.state === 'payed' };
    },
  };
}

export function heleket(config: Record<string, string>): Gateway {
  const send = async (http: GatewayHttp, path: string, data: Record<string, unknown>) => {
    const body = phpJson(data);
    const result = await http('POST', `https://api.heleket.com/v1/payment${path}`, body, { merchant: config.merchantId, sign: hash('md5', Buffer.from(body).toString('base64') + config.secret) });
    assertGateway(result.state === 0 && result.result);
    return result.result;
  };
  return {
    async create(context, http) {
      const result = await send(http, '', {
        amount: decimal(context), currency: context.payment.provider_currency, order_id: String(context.payment.id),
        additional_data: String(context.payment.id), accuracy_payment_percent: 0, url_callback: context.callback,
        url_return: context.fail, url_success: context.success,
      });
      assertGateway(result.uuid);
      return { id: String(result.uuid), link: checkoutUrl(result.url) };
    },
    async verify(request, http) {
      const { sign, ...body } = request.body;
      assertGateway(equal(sign, hash('md5', Buffer.from(phpJson(body)).toString('base64') + config.secret)) && typeof body.uuid === 'string');
      const result = await send(http, '/info', { uuid: body.uuid });
      assertGateway(result.uuid === body.uuid);
      return { providerId: result.uuid, transactionId: result.uuid, orderId: String(result.order_id), amount: result.amount, currency: result.currency, paid: ['paid', 'paid_over'].includes(result.payment_status ?? result.status) };
    },
  };
}

export function yookassa(config: Record<string, string>): Gateway {
  const headers = basic(config.shopId, config.secret);
  return {
    async create(context, http) {
      const amount = { value: decimal(context), currency: context.payment.provider_currency };
      const body: Record<string, unknown> = {
        amount, capture: true, confirmation: { type: 'redirect', return_url: context.success },
        description: description(context), metadata: { order_id: String(context.payment.id) },
      };
      if (config.receipts === 'true') {
        const receipt: Record<string, unknown> = {
          customer: { email: context.user.email },
          items: [{ description: description(context), quantity: '1.00', amount, vat_code: Number(config.vat), payment_subject: config.paymentSubject, payment_mode: config.paymentMode }],
        };
        if (config.taxSystem) receipt.tax_system_code = Number(config.taxSystem);
        body.receipt = receipt;
      }
      const result = await http('POST', 'https://api.yookassa.ru/v3/payments', body, { ...headers, 'Idempotence-Key': `unicore-${context.payment.id}` });
      assertGateway(result.id && result.test === (config.test === 'true'));
      return { id: String(result.id), link: checkoutUrl(result.confirmation?.confirmation_url) };
    },
    async verify(request, http) {
      assertGateway(request.body.type === 'notification' && typeof request.body.object?.id === 'string');
      if (request.body.event !== 'payment.succeeded') return { paid: false };
      const result = await http('GET', `https://api.yookassa.ru/v3/payments/${encodeURIComponent(request.body.object.id)}`, undefined, headers);
      assertGateway(result.id === request.body.object.id && String(result.recipient?.account_id) === config.shopId && result.test === (config.test === 'true'));
      return { providerId: result.id, transactionId: result.id, orderId: result.metadata?.order_id, amount: result.amount?.value, currency: result.amount?.currency, paid: result.status === 'succeeded' && result.paid === true };
    },
  };
}

export function cloudpayments(config: Record<string, string>): Gateway {
  const headers = basic(config.publicId, config.secret);
  return {
    async create(context, http) {
      const body: Record<string, unknown> = {
        Amount: Number(decimal(context)), Currency: context.payment.provider_currency, Description: description(context),
        InvoiceId: String(context.payment.id), AccountId: context.user.uuid, RequireConfirmation: false, SendEmail: false,
        SuccessRedirectUrl: context.success, FailRedirectUrl: context.fail,
      };
      if (config.receipts === 'true') {
        const receipt: Record<string, unknown> = {
          Email: context.user.email, Items: [{ label: description(context), price: Number(decimal(context)), quantity: 1, amount: Number(decimal(context)), vat: config.vat === 'none' ? null : Number(config.vat), method: Number(config.paymentMode), object: Number(config.paymentSubject) }],
          Amounts: { electronic: Number(decimal(context)) },
        };
        if (config.taxSystem) receipt.TaxationSystem = Number(config.taxSystem);
        body.JsonData = { cloudPayments: { customerReceipt: receipt } };
      }
      const result = await http('POST', 'https://api.cloudpayments.ru/orders/create', body, { ...headers, 'X-Request-ID': `unicore-${context.payment.id}` });
      assertGateway(result.Success === true && result.Model?.Id);
      return { id: String(result.Model.Id), link: checkoutUrl(result.Model.Url) };
    },
    async verify(request, http) {
      const encoded = request.headers['content-hmac'];
      const decoded = request.headers['x-content-hmac'];
      const valid = encoded
        ? equal(encoded, hmac(request.raw, config.secret, 'base64'))
        : equal(decoded, hmac(decodeURIComponent(request.raw.toString('utf8').replace(/\+/g, ' ')), config.secret, 'base64'));
      assertGateway(valid && request.body.TransactionId);
      const result = await http('POST', 'https://api.cloudpayments.ru/payments/get', { TransactionId: request.body.TransactionId }, headers);
      const payment = result.Model;
      assertGateway(result.Success === true && payment && String(payment.TransactionId) === String(request.body.TransactionId));
      assertGateway(payment.TestMode === (config.test === 'true'));
      return { orderId: String(payment.InvoiceId), userId: String(payment.AccountId), transactionId: String(payment.TransactionId), amount: payment.Amount, currency: payment.Currency, paid: payment.Status === 'Completed' && payment.OperationType === 'Payment', response: { code: 0 } };
    },
  };
}

export function lava(config: Record<string, string>): Gateway {
  const send = async (http: GatewayHttp, path: string, data: Record<string, unknown>) => {
    const body = phpJson(sorted(data));
    const result = await http('POST', `https://api.lava.ru/business/invoice/${path}`, body, { Signature: hmac(body, config.secret) });
    assertGateway(result.status_check === true && result.status === 200 && result.data);
    return result.data;
  };
  return {
    async create(context, http) {
      const result = await send(http, 'create', { sum: Number(decimal(context)), orderId: String(context.payment.id), shopId: config.shopId, hookUrl: context.callback, successUrl: context.success, failUrl: context.fail, comment: description(context), expire: 60 });
      assertGateway(result.id);
      return { id: String(result.id), link: checkoutUrl(result.url) };
    },
    async verify(request, http) {
      const canonical = phpJson(sorted(request.body)).replace(/[\u007f-\uffff]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
      assertGateway(equal(request.headers.signature, hmac(request.raw, config.additionalKey)) || equal(request.headers.signature, hmac(canonical, config.additionalKey)));
      assertGateway(typeof request.body.invoice_id === 'string');
      const result = await send(http, 'status', { shopId: config.shopId, invoiceId: request.body.invoice_id });
      assertGateway(result.id === request.body.invoice_id && String(result.shop_id) === config.shopId);
      return { providerId: String(result.id), transactionId: String(result.id), orderId: String(result.order_id), amount: result.amount, currency: config.currency, paid: result.status === 'success' };
    },
  };
}
