import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createUser, rootSession } from './helpers/stand.mjs';

let server = null;

let product = null;

before(async () => {
  server = (await query('SELECT id FROM unicore_servers ORDER BY priority ASC LIMIT 1'))[0]?.id ?? null;

  if (!server) return;

  const rows = await query(
    'SELECT p.id, p.price FROM unicore_products p JOIN unicore_servers_products sp ON sp.product_id = p.id WHERE sp.server_id = ? AND p.price > 0 LIMIT 1',
    [server],
  );

  product = rows[0] ?? null;
});

after(async () => {
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

const balanceOf = async (uuid) => Number((await query('SELECT `real` AS money FROM unicore_users WHERE uuid = ?', [uuid]))[0]?.money ?? 0);

async function playerWithCart(amount = 1) {
  const player = await createUser();
  const [row] = await query('SELECT uuid FROM unicore_users WHERE username = ?', [player.username]);

  await query('UPDATE unicore_users SET `real` = 100000 WHERE uuid = ?', [row.uuid]);

  const added = await player.session.post('/store/cart/add', {
    id: product.id,
    type: 'product',
    server_id: server,
    amount,
  });

  assert.ok(ok(added.status), `товар не добавлен в корзину: ${added.status} ${JSON.stringify(added.body)}`);

  return { ...player, uuid: row.uuid };
}

describe('Корзина', () => {
  it('пустую корзину купить нельзя', async () => {
    if (!server || !product) return;

    const player = await createUser();

    const { status } = await player.session.post('/store/cart/buy', { server_id: server, use_virtual: false });

    assert.equal(status, 400);
  });

  it('две параллельные покупки одной корзины списывают деньги один раз', async () => {
    if (!server || !product) return;

    const player = await playerWithCart();
    const before_ = await balanceOf(player.uuid);
    const price = Number(product.price);

    const results = await Promise.all([
      player.session.post('/store/cart/buy', { server_id: server, use_virtual: false }),
      player.session.post('/store/cart/buy', { server_id: server, use_virtual: false }),
    ]);

    const passed = results.filter((res) => ok(res.status));

    assert.equal(passed.length, 1, `покупка прошла ${passed.length} раз(а): ${results.map((r) => r.status).join(', ')}`);

    const after_ = await balanceOf(player.uuid);
    const spent = Math.round((before_ - after_) * 100) / 100;

    assert.equal(spent, Math.round(price * 100) / 100, `списано ${spent}, ожидалось ${price}`);

    const left = await query('SELECT COUNT(*) AS total FROM unicore_cart_items WHERE user_uuid = ?', [player.uuid]);

    assert.equal(Number(left[0].total), 0, 'корзина осталась непустой после покупки');
  });
});
