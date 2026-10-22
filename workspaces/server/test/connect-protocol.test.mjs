import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { compileSource } from './helpers/compile-source.mjs';

let directory, protocol;
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'unicore-connect-'));
  protocol = await compileSource('game/connect/connect.protocol.ts', directory);
});
after(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });
const checkpoint = (values = {}) => ({ sessionId: 'session', userUuid: 'player', sequence: 1, connectedMs: 30_000, activeMs: 20_000, closed: false, ...values });

describe('Сессии Connect v2', () => {
  it('повтор и старый пакет не начисляют время повторно', () => {
    const first = checkpoint();
    assert.deepEqual(protocol.checkpointDelta(null, first), { connectedMs: 30_000, activeMs: 20_000, accepted: true });
    assert.equal(protocol.checkpointDelta(first, first).accepted, false);
    assert.equal(protocol.checkpointDelta({ ...first, sequence: 3 }, first).accepted, false);
    assert.deepEqual(protocol.checkpointDelta(first, checkpoint({ sequence: 2, connectedMs: 40_000, activeMs: 20_000 })), { connectedMs: 10_000, activeMs: 0, accepted: true });
  });
  it('отклоняет регресс, переоткрытие и неверный активный интервал', () => {
    assert.throws(() => protocol.checkpointDelta(checkpoint(), checkpoint({ sequence: 2, connectedMs: 10_000 })), /regress|Invalid/);
    assert.throws(() => protocol.checkpointDelta(checkpoint({ closed: true }), checkpoint({ sequence: 2 })), /reopen/);
    assert.throws(() => protocol.checkpointDelta(null, checkpoint({ activeMs: 40_000 })), /Invalid/);
    assert.throws(() => protocol.checkpointDelta(checkpoint(), checkpoint({ sequence: 2, connectedMs: 31_000, activeMs: 30_000 })), /interval/);
  });
  it('принимает разницу округления накопительных счётчиков в одну миллисекунду после AFK', () => {
    const previous = checkpoint({ sequence: 61, connectedMs: 59_412, activeMs: 41_403 });
    const next = checkpoint({ sequence: 80, connectedMs: 77_719, activeMs: 59_711, closed: true });
    assert.deepEqual(protocol.checkpointDelta(previous, next), { connectedMs: 18_307, activeMs: 18_308, accepted: true });
    assert.throws(() => protocol.checkpointDelta(previous, { ...next, activeMs: 59_712 }), /interval/);
  });
});

describe('Публичное присутствие Connect', () => {
  const observed = 1_000_000;
  const snapshot = { sequence: 1, observedAtMs: observed, maxPlayers: 100, players: [
    { uuid: 'active', name: 'Active', activity: 'ACTIVE', visibility: 'VISIBLE' },
    { uuid: 'afk', name: 'Afk', activity: 'AFK', visibility: 'VISIBLE' },
    { uuid: 'hidden', name: 'Hidden', activity: 'ACTIVE', visibility: 'HIDDEN' },
  ] };
  it('считает AFK и скрывает vanish вместе с UUID', () => {
    const view = protocol.publicPresence(snapshot, new Date(observed), observed + 1000);
    assert.equal(view.players, 2);
    assert.equal(view.playerList[1].afk, true);
    assert.ok(!JSON.stringify(view).includes('hidden'));
  });
  it('различает пустой сервер и устаревшие данные', () => {
    assert.equal(protocol.publicPresence({ ...snapshot, players: [] }, new Date(observed), observed + 1000).players, 0);
    const view = protocol.publicPresence(snapshot, new Date(observed), observed + 45_001);
    assert.equal(view.players, null);
    assert.equal(view.online, null);
    assert.equal(view.freshness, 'stale');
    assert.deepEqual(view.playerList, []);
  });
  it('не объявляет неизвестную видимость публичной', () => {
    const view = protocol.publicPresence({ ...snapshot, players: [{ ...snapshot.players[0], visibility: 'UNKNOWN' }] }, new Date(observed), observed);
    assert.equal(view.players, null);
    assert.deepEqual(view.playerList, []);
  });
  it('объединяет UUID и сохраняет скрытие при переходе между экземплярами', () => {
    const sample = { snapshot, lastSeenAt: new Date(observed) };
    assert.equal(protocol.mergePresence([sample, sample], observed).players, 2);
    const hidden = { ...sample, snapshot: { ...snapshot, players: [{ ...snapshot.players[0], visibility: 'HIDDEN' }] } };
    const merged = protocol.mergePresence([sample, hidden], observed);
    assert.equal(merged.players, 1);
    assert.deepEqual(merged.playerList.map((player) => player.uuid), ['afk']);
    assert.equal(protocol.mergePresence([sample, { ...sample, lastSeenAt: new Date(0) }], observed).players, null);
  });
});
