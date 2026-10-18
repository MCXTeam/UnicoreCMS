import { CheckoutContext, Gateway, GatewayCheckout, GatewayHttp, assertGateway, basic, checkoutUrl, decimal, description, equal, hash, hmac } from './protocol';

export function tebex(config: Record<string, string>): Gateway {
  const checkoutAuth = basic(config.projectId, config.privateKey);
  const headlessAuth = basic(config.publicToken, config.privateKey);
  const account = `https://headless.tebex.io/api/accounts/${encodeURIComponent(config.publicToken)}`;

  const headless = async (context: CheckoutContext, http: GatewayHttp, initial?: any): Promise<GatewayCheckout> => {
    const id = String(initial?.ident || context.payment.provider_id);
    let basket = initial ?? (await http('GET', `${account}/baskets/${encodeURIComponent(id)}`)).data;
    assertGateway(basket?.ident === id && basket.currency === context.payment.provider_currency);
    const auth = await http('GET', `${account}/baskets/${encodeURIComponent(id)}/auth?returnUrl=${encodeURIComponent(context.resume(id))}`);
    if (Array.isArray(auth) && auth.length && !basket.username_id) return { id, link: checkoutUrl(auth[0].url), data: { mode: 'headless' } };
    const slug = `unicore-${context.payment.id}`;
    let selected = basket.packages?.find((item) => item.slug === slug || String(item.id) === context.payment.provider_data?.packageId);
    if (!selected) {
      const username = typeof basket.username === 'string' ? basket.username : basket.username?.username || context.user.username;
      await http('PUT', `${account}/baskets/${encodeURIComponent(id)}/dynamic-packages`, {
        basket_id: id, username, category_id: Number(config.categoryId),
        packages: [{ name: description(context), price: Number(decimal(context)), slug, custom: { orderId: String(context.payment.id) } }],
      }, headlessAuth);
      const category = await http('GET', `${account}/categories/${encodeURIComponent(config.categoryId)}?includePackages=1&basketIdent=${encodeURIComponent(id)}`);
      selected = category.data?.packages?.find((item) => item.slug === slug);
      assertGateway(selected?.ident && selected.id != null);
      await http('POST', `https://headless.tebex.io/api/baskets/${encodeURIComponent(id)}/packages`, { package_id: selected.ident, quantity: 1, dynamic: true, custom: { orderId: String(context.payment.id) } });
    }
    const packageId = String(selected.id);
    basket = (await http('GET', `${account}/baskets/${encodeURIComponent(id)}`)).data;
    assertGateway(basket?.currency === context.payment.provider_currency && Number(basket.base_price) === Number(context.payment.provider_amount));
    assertGateway(basket.packages?.length === 1 && Number(basket.packages[0].in_basket?.quantity) === 1);
    return { id, link: checkoutUrl(basket.links?.checkout), data: { mode: 'headless', packageId, packageIdent: String(selected.ident || '') } };
  };

  return {
    async create(context, http) {
      if (config.mode === 'headless') {
        const result = await http('POST', `${account}/baskets`, {
          username: context.user.username, ip_address: context.ip, complete_url: context.success,
          cancel_url: context.fail, complete_auto_redirect: true, custom: { orderId: String(context.payment.id) },
        });
        assertGateway(result.data?.ident);
        return headless(context, http, result.data);
      }
      const result = await http('POST', 'https://checkout.tebex.io/api/checkout', {
        basket: { return_url: context.fail, complete_url: context.success, ip: context.ip, email: context.user.email, custom: { orderId: String(context.payment.id) } },
        items: [{ package: { name: description(context), price: Number(decimal(context)), type: 'single', custom: { orderId: String(context.payment.id) } }, qty: 1, type: 'single' }],
      }, checkoutAuth);
      assertGateway(result.ident);
      return { id: String(result.ident), link: checkoutUrl(result.links?.checkout), data: { mode: 'checkout' } };
    },
    resume: headless,
    async verify(request) {
      assertGateway(equal(request.headers['x-signature'], hmac(hash('sha256', request.raw), config.webhookSecret)));
      const body = request.body;
      if (body.type === 'validation.webhook') { assertGateway(typeof body.id === 'string'); return { response: { id: body.id } }; }
      if (body.type !== 'payment.completed') return { paid: false };
      const payment = body.subject;
      assertGateway(payment?.status?.id === 1 && typeof payment.transaction_id === 'string' && payment.products?.length === 1);
      const product = payment.products[0];
      assertGateway(Number(product.quantity) === 1 && product.custom?.orderId);
      const orderId = String(product.custom.orderId);
      assertGateway(!payment.custom?.orderId || String(payment.custom.orderId) === orderId);
      assertGateway(!payment.gift_cards?.length && !payment.coupons?.length);
      return { orderId, transactionId: payment.transaction_id, productId: product.id == null ? undefined : String(product.id), amount: product.paid_price?.amount, currency: product.paid_price?.currency, paid: true };
    },
  };
}
