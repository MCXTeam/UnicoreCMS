import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createAdmin } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

async function catalogServer() {
  const rows = await query(
    'SELECT server_id AS id, COUNT(*) AS total FROM unicore_servers_products GROUP BY server_id ORDER BY total DESC LIMIT 1',
  );

  return rows[0]?.id ?? null;
}

async function catalog(session, server, extra = '') {
  const { status, body } = await session.get(`/store/products/protected/products?limit=100&filter.server=${server}${extra}`);

  assert.equal(status, 200, `каталог отвечает ошибкой: ${status}`);

  return body;
}

const priceOf = (item) => Number(item.payload?.price ?? 0);

describe('Каталог магазина', () => {
  it('фильтр по цене в точечной записи применяется', async () => {
    const server = await catalogServer();

    if (!server) return;

    const { session } = await createAdmin([]);
    const all = await catalog(session, server);
    const cheap = await catalog(session, server, `&filter.price=${encodeURIComponent('$btw:0,1')}`);

    assert.ok(all.meta.totalItems > 0, 'каталог пуст, проверять нечего');
    assert.ok(cheap.meta.totalItems < all.meta.totalItems, 'фильтр по цене не сузил выборку');

    for (const item of cheap.data) assert.ok(priceOf(item) <= 1, `в выборку попал товар за ${priceOf(item)}`);
  });

  it('фильтр по цене в скобочной записи применяется так же', async () => {
    const server = await catalogServer();

    if (!server) return;

    const { session } = await createAdmin([]);
    const dot = await catalog(session, server, `&filter.price=${encodeURIComponent('$btw:0,1')}`);
    const bracket = await catalog(session, server, `&${encodeURIComponent('filter[price]')}=${encodeURIComponent('$btw:0,1')}`);

    assert.equal(bracket.meta.totalItems, dot.meta.totalItems, 'записи фильтра дают разный результат');
  });

  it('товар с чужого сервера в каталог не попадает', async () => {
    const server = await catalogServer();

    if (!server) return;

    const rows = await query('SELECT product_id FROM unicore_servers_products WHERE server_id = ? LIMIT 1', [server]);
    const productId = rows[0]?.product_id;

    if (!productId) return;

    const { session } = await createAdmin([]);

    await query('DELETE FROM unicore_servers_products WHERE server_id = ? AND product_id = ?', [server, productId]);

    try {
      const body = await catalog(session, server);
      const found = body.data.some((item) => item.type === 'product' && item.payload?.id === productId);

      assert.equal(found, false, 'отвязанный от сервера товар всё равно показан в каталоге');
    } finally {
      await query('INSERT IGNORE INTO unicore_servers_products (server_id, product_id) VALUES (?, ?)', [server, productId]);
    }
  });
});
