import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { compileConnect } from './helpers/compile-connect.mjs';

describe('Connect: public online and records', () => {
  let directory, OnlineService;
  before(async () => {
    directory = await mkdtemp(join(tmpdir(), 'unicore-online-'));
    OnlineService = (await compileConnect(directory)).module.OnlineService;
  });
  after(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });

  it('resets a server daily record at UTC midnight even if count has not changed', async () => {
    let patch;
    const update = { update() { return this; }, set(value) { patch = value; return this; }, where() { return this; }, async execute() {} };
    const service = new OnlineService({ createQueryBuilder: () => update }, {}, {}, {}, {});
    const server = { id: 'test', instances: [], online: { online: true, players: 3, maxplayers: 100, record: 20, record_today: 15, updated: new Date(Date.now() - 86400000) } };
    await service.updateOnline(server, { online: true, players: 3, maxplayers: 100 });
    assert.equal(patch.record_today, 3);
    assert.equal(patch.record, 20);
  });

  it('creates a zero daily record without requiring a player count change', async () => {
    let written;
    const records = { findOne: async () => null, save: async (row) => { written = row; return { ...row, created: new Date() }; } };
    const service = new OnlineService({}, {}, records, {}, {});
    service.find = async () => ({ servers: [], total: { online: 0, aggregation: 'unique', records: { today: { online: 0, created: new Date() }, absolute: { online: 10 } } } });
    await service.updateOnlinesRecords();
    assert.deepEqual(written, { online: 0 });
  });

  it('uses a network UUID union and hides instance ping counts in public responses', async () => {
    let stale = false;
    const rows = () => ['first', 'second'].map((serverId) => ({ serverId, players: 1, server: { id: serverId, priority: 1, instances: [{ online: true, players: 99, maxplayers: 100 }] } }));
    const presence = { overview: async () => ({ views: new Map(['first', 'second'].map((id) => [id, { online: true, players: stale ? null : 1, maxplayers: 100, source: 'connect', freshness: stale ? 'stale' : 'fresh', playerList: [] }])), network: { players: stale ? null : 1 } }) };
    const service = new OnlineService({ find: async () => rows() }, {}, { findOne: async () => null }, { find: async () => [] }, presence);
    const first = await service.find();
    assert.equal(first.total.online, 1);
    assert.equal(first.total.aggregation, 'unique');
    assert.equal(first.servers[0].server.instances[0].players, null);
    stale = true;
    assert.equal((await service.find()).total.online, null);
  });
});
