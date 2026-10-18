import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { compileSource } from './helpers/compile-source.mjs';

test('schema alignment skips only identical existing indexes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'unicore-index-'));
  try {
    const { unchangedIndexQueries } = await compileSource('migrations/unchanged-indexes.ts', directory);
    const drop = 'DROP INDEX `payment_invoice` ON `unicore_payments`';
    const create = 'CREATE UNIQUE INDEX `payment_invoice` ON `unicore_payments` (`method`, `provider_id`)';
    const queries = [{ query: drop }, { query: create }];
    const runner = (indices) => ({ getTable: async () => ({ indices }) });
    const identical = { name: 'payment_invoice', isUnique: true, columnNames: ['method', 'provider_id'] };
    assert.deepEqual([...await unchangedIndexQueries(queries, runner([identical]))], [create, drop]);
    for (const indexes of [[], [{ ...identical, isUnique: false }], [{ ...identical, columnNames: ['provider_id', 'method'] }], [{ ...identical, columnNames: ['method'] }], [{ ...identical, isFulltext: true }], [{ ...identical, isSpatial: true }], [{ ...identical, isNullFiltered: true }], [{ ...identical, where: 'provider_id IS NOT NULL' }]]) {
      assert.equal((await unchangedIndexQueries(queries, runner(indexes))).size, 0);
    }
    assert.equal((await unchangedIndexQueries([{ query: drop }], runner([identical]))).size, 0);
    assert.equal((await unchangedIndexQueries(queries, { getTable: async () => undefined })).size, 0);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
