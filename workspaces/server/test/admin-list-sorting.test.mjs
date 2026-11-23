import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { closeDatabase } from './helpers/db.mjs';
import { cleanup, rootSession } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

test('наборы магазина сортируются по цене и скидке', async () => {
  const admin = await rootSession();
  const server = `qasort${Date.now()}`;
  const ids = [];
  const created = await admin.post('/servers', {
    id: server,
    name: 'QA sorting',
    version: '1.21',
    query: { host: '127.0.0.1', port: 25565 },
    table: [],
    mods: [],
  });
  assert.equal(created.status, 201);
  try {
    for (const [price, sale] of [
      [30, 10],
      [10, 30],
      [20, 20],
    ]) {
      const result = await admin.post('/store/kits', {
        name: `QA sort ${price}`,
        price,
        sale,
        servers: [server],
        categories: [],
        items: [],
      });
      assert.equal(result.status, 201);
      ids.push(result.body.id);
    }
    for (const column of ['price', 'sale']) {
      for (const direction of ['ASC', 'DESC']) {
        const result = await admin.get(`/store/kits?filter.servers=${server}&sortBy=${column}:${direction}`);
        assert.equal(result.status, 200);
        const values = result.body.data.map((kit) => Number(kit[column]));
        assert.equal(values.length, 3);
        assert.deepEqual(values, direction === 'ASC' ? [10, 20, 30] : [30, 20, 10]);
      }
    }
  } finally {
    for (const id of ids) await admin.request('DELETE', `/store/kits/${id}`);
    await admin.request('DELETE', `/servers/${server}`);
  }
});
