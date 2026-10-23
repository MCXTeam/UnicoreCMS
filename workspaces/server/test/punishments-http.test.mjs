import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { api } from './helpers/env.mjs';
import { cleanup, createAdmin } from './helpers/stand.mjs';
import { closeDatabase } from './helpers/db.mjs';
import { punishmentStand } from './helpers/punishment-stand.mjs';

describe('Punishments: running CMS and validated HTTP protocol', { skip: process.env.PUNISHMENTS_HTTP_TEST !== '1' }, () => {
  let stand;
  before(async () => { stand = await punishmentStand(); });
  after(async () => { if (stand) await stand.cleanup(); await cleanup(); await closeDatabase(); });
  it('shows one logical group ban in the public list, profile and cabinet', async () => {
    for (const path of ['/players/banlist', `/punishments/public/player/${stand.player.username}`, '/punishments/public']) {
      const response = await fetch(`${api}${path}?subjectUuid=${stand.uuid}`);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.data.filter((row) => row.id === stand.item.id).length, 1);
      assert.equal(body.data[0].scope.type, 'GROUP');
      assert.ok(!JSON.stringify(body).includes('password'));
    }
    assert.equal(stand.item.quote.available, true);
    assert.equal(stand.item.quote.price, 150);
    assert.equal(stand.item.delivery.applied, 2);
  });
  it('rejects local-only group removal and malformed provider descriptors', async () => {
    const restricted = await createAdmin([`panel.punishments.revoke.server:${stand.serverId}`]);
    assert.equal((await restricted.session.post(`/punishments/admin/cases/${stand.item.id}/revoke`, { revision: 1 })).status, 403);
    assert.equal((await restricted.session.get('/punishments/admin')).body.data.length, 0);
    await stand.kernel('/punishments/poll', { ...stand.nodes[0].connection, providerId: 'vanilla', mode: 'bidirectional', descriptor: { id: 'vanilla', version: 'missing-capabilities' } }, 400);
  });
  it('holds one reservation through replay and completes after both HTTP confirmations', async () => {
    const requestId = randomUUID();
    const purchase = await stand.player.session.post(`/cabinet/punishments/${stand.item.id}/purchase`, { requestId, revision: 1, quotedPrice: 150 });
    assert.equal(purchase.status, 201, JSON.stringify(purchase.body));
    assert.equal(purchase.body.status, 'RESERVED');
    const replay = await stand.player.session.post(`/cabinet/punishments/${stand.item.id}/purchase`, { requestId, revision: 1, quotedPrice: 150 });
    assert.equal(replay.body.id, purchase.body.id);
    assert.equal((await stand.player.session.get('/auth/me')).body.user.real, 850);
    const [a,b] = await Promise.all(stand.nodes.map(stand.poll));
    await stand.acknowledge(stand.nodes[0], a.commands[0]);
    const partial = await stand.player.session.get('/cabinet/punishments');
    assert.equal(partial.body.reservedBalance, 150);
    await stand.acknowledge(stand.nodes[1], b.commands[0]);
    const deadline = Date.now() + 12000;
    let result;
    do {
      result = await stand.player.session.get('/cabinet/punishments?tab=history');
      if (result.body.purchases.find((row) => row.id === purchase.body.id)?.status === 'COMPLETED') break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    assert.equal(result.body.purchases.find((row) => row.id === purchase.body.id)?.status, 'COMPLETED');
    assert.equal(result.body.reservedBalance, 0);
    assert.equal((await stand.player.session.get('/auth/me')).body.user.real, 850);
    assert.equal(result.body.data[0].status, 'REVOKED');
  });
});
