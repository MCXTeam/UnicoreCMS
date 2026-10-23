import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { compileConnect } from './helpers/compile-connect.mjs';

describe('Punishments: real MariaDB ownership, delivery and money', { skip: process.env.CONNECT_TEST_DB !== '1' }, () => {
  let directory, mod, db, identity, protocol, delivery, coordinator, access, accounts, policy, purchases, groups, admin, views, tasks;
  const token = 'a'.repeat(64);
  const actor = { user: { uuid: randomUUID(), username: 'Moderator', superuser: true, roles: [] } };
  const caps = { kinds: ['BAN', 'MUTE'], issueKinds: ['BAN', 'MUTE'], revokeKinds: ['BAN', 'MUTE'], subjects: ['PLAYER'], exactRevoke: true };
  before(async () => {
    directory = await mkdtemp(join(tmpdir(), 'unicore-punishments-db-'));
    const compiled = await compileConnect(directory);
    mod = compiled.module;
    const { DataSource, getMetadataArgsStorage } = compiled.require('typeorm');
    const entities = getMetadataArgsStorage().tables.map((row) => row.target).filter((type) => typeof type === 'function');
    db = new DataSource({ type: 'mariadb', host: '127.0.0.1', port: Number(process.env.CONNECT_TEST_PORT || 13316), username: 'root', password: '', database: 'punishments_contracts', entities, synchronize: true, dropSchema: true, timezone: 'Z', extra: { connectionLimit: 12 } });
    await db.initialize();
    await db.query('INSERT INTO unicore_users (uuid,username,superuser) VALUES (?,?,1)', [actor.user.uuid, actor.user.username]);
    identity = new mod.ConnectIdentityService(db);
    delivery = new mod.PunishmentDeliveryService();
    coordinator = new mod.PunishmentCoordinator(delivery);
    access = new mod.PunishmentAccess(db, delivery);
    accounts = new mod.AccountRestrictionsService(db);
    policy = new mod.PunishmentPolicy({ load: async () => ({ public_unban_price: 75 }) }, delivery);
    purchases = new mod.PunishmentPurchasesService(db, accounts, coordinator, policy);
    groups = new mod.PunishmentGroupsService(db, delivery);
    admin = new mod.PunishmentAdmin(db, access, coordinator, delivery, accounts);
    views = new mod.PunishmentViews(db, access, policy);
    tasks = new mod.PunishmentTasks(db, accounts, coordinator, delivery, purchases);
    protocol = new mod.GamePunishmentsService(identity, db, coordinator, delivery, access);
  });
  after(async () => { if (db?.isInitialized) await db.destroy(); if (directory) await rm(directory, { recursive: true, force: true }); });
  const repository = (type) => db.getRepository(mod[type]);
  async function user() {
    const uuid = randomUUID();
    await db.query('INSERT INTO unicore_users (uuid,username,`real`) VALUES (?,?,1000)', [uuid, `P${uuid.slice(0,8)}`]);
    return uuid;
  }
  async function world() {
    const serverId = randomUUID();
    await db.query('INSERT INTO unicore_servers (id,name) VALUES (?,?)', [serverId, 'Game']);
    const nodes = [];
    for (let i = 0; i < 3; i++) {
      const connection = { serverId, instanceId: randomUUID(), bootId: randomUUID(), epoch: 0 };
      connection.epoch = (await identity.register(connection, token)).epoch;
      const streamId = identity.streamId(connection);
      await protocol.poll({ ...connection, providerId: 'vanilla', mode: 'bidirectional', descriptor: { id: 'vanilla', version: 'test', capabilities: caps } }, token);
      nodes.push({ connection, streamId, providerId: 'vanilla', primaryKinds: ['BAN', 'MUTE'] });
    }
    const id = randomUUID();
    const group = await groups.save({ id, name: 'Group', kinds: ['BAN', 'MUTE'], members: nodes.slice(0,2).map(({ streamId, providerId, primaryKinds }) => ({ streamId, providerId, primaryKinds })), enabled: true, unban: { enabled: true, price: 150 }, revision: 0 }, actor.user.uuid);
    return { nodes, group, uuid: await user() };
  }
  async function native(node, uuid, origin = 'LIVE', override = {}) {
    const punishment = { id: 'native', providerId: 'vanilla', externalId: randomUUID(), kind: 'BAN', subject: { kind: 'PLAYER', value: uuid }, scope: { serverId: node.connection.serverId }, reason: 'Rule', issuedAtMs: Date.now(), status: 'ACTIVE', revision: 0, ...override };
    await protocol.events({ ...node.connection, events: [{ eventId: randomUUID(), origin, punishment }] }, token);
    return repository('GamePunishment').findOneByOrFail({ streamId: node.streamId, subjectUuid: uuid, providerId: 'vanilla', issuedAtMs: punishment.issuedAtMs });
  }
  async function commands(node) { return (await protocol.poll({ ...node.connection, providerId: 'vanilla' }, token)).commands; }
  async function acknowledge(node, command, status = 'APPLIED', withObservation = true) {
    const externalId = command.revoke ? command.punishment.externalId : randomUUID();
    const observed = { ...command.punishment, externalId, status: command.revoke ? 'REVOKED' : 'ACTIVE' };
    await protocol.acknowledge({ ...node.connection, commandId: command.commandId, result: { status, externalId, ...(withObservation ? { observed } : {}) } }, token);
    return observed;
  }
  async function appliedGroup() {
    const w = await world();
    const row = await native(w.nodes[0], w.uuid);
    w.caseId = row.caseId;
    await acknowledge(w.nodes[1], (await commands(w.nodes[1]))[0]);
    return w;
  }
  async function balance(uuid) { return Number((await db.query('SELECT `real` FROM unicore_users WHERE uuid=?', [uuid]))[0].real); }

  it('preserves snapshot scope and groups only new native commands without relaying copies', async () => {
    const w = await world();
    const old = await native(w.nodes[0], await user(), 'SNAPSHOT');
    assert.equal((await repository('PunishmentCase').findOneByOrFail({ id: old.caseId })).scopeType, 'NATIVE');
    assert.equal((await commands(w.nodes[1])).length, 0);
    const source = await native(w.nodes[0], w.uuid);
    const item = await repository('PunishmentCase').findOneByOrFail({ id: source.caseId });
    assert.equal(item.scopeId, w.group.id);
    const copy = (await commands(w.nodes[1]))[0];
    assert.ok(copy);
    await acknowledge(w.nodes[1], copy);
    assert.equal(await repository('PunishmentCase').countBy({ subjectUuid: w.uuid }), 1);
    assert.equal((await commands(w.nodes[2])).length, 0);
  });

  it('propagates native unban, leaves independent bans intact and isolates scoped rights', async () => {
    const w = await appliedGroup();
    const independent = await native(w.nodes[2], w.uuid);
    await assert.rejects(admin.revoke({ user: { uuid: actor.user.uuid, perms: [`panel.punishments.revoke.server:${w.nodes[0].connection.serverId}`] } }, w.caseId, 1), /Нет доступа/);
    const source = await repository('GamePunishment').findOneByOrFail({ streamId: w.nodes[0].streamId, caseId: w.caseId });
    await protocol.events({ ...w.nodes[0].connection, events: [{ eventId: randomUUID(), origin: 'LIVE', punishment: { ...source.payload, status: 'REVOKED' } }] }, token);
    const revoke = (await commands(w.nodes[1]))[0];
    assert.equal(revoke.revoke, true);
    await acknowledge(w.nodes[1], revoke);
    assert.equal((await repository('PunishmentCase').findOneByOrFail({ id: w.caseId })).status, 'REVOKED');
    assert.equal((await repository('GamePunishment').findOneByOrFail({ id: independent.id })).status, 'ACTIVE');
  });

  it('reserves once under concurrent requests and charges only after every confirmed removal', async () => {
    const w = await appliedGroup();
    const requestId = randomUUID();
    const result = await Promise.all(Array.from({ length: 6 }, () => purchases.buy(w.uuid, w.caseId, requestId, 1, '127.0.0.1')));
    assert.equal(new Set(result.map((row) => row.id)).size, 1);
    assert.equal(await balance(w.uuid), 850);
    const a = (await commands(w.nodes[0]))[0], b = (await commands(w.nodes[1]))[0];
    await acknowledge(w.nodes[0], a);
    await tasks.tick();
    assert.equal((await repository('PunishmentPurchase').findOneByOrFail({ id: result[0].id })).status, 'RESERVED');
    await acknowledge(w.nodes[1], b, 'APPLIED', false);
    await tasks.tick();
    assert.equal((await repository('PunishmentPurchase').findOneByOrFail({ id: result[0].id })).status, 'RESERVED');
    const observed = await repository('GamePunishment').findOneByOrFail({ streamId: w.nodes[1].streamId, caseId: w.caseId });
    await protocol.events({ ...w.nodes[1].connection, events: [{ eventId: randomUUID(), punishment: { ...observed.payload, status: 'REVOKED' } }] }, token);
    await tasks.tick();
    assert.equal((await repository('PunishmentPurchase').findOneByOrFail({ id: result[0].id })).status, 'COMPLETED');
    assert.equal(await balance(w.uuid), 850);
    assert.equal(Number((await db.query('SELECT COUNT(*) AS n FROM unicore_history WHERE userUuid=?', [w.uuid]))[0].n), 1);
  });

  it('returns the whole reserve on natural expiry, preserving completed removals', async () => {
    const w = await appliedGroup();
    const expiry = Date.now() + 50_000;
    await repository('PunishmentCase').update({ id: w.caseId }, { expiresAtMs: expiry });
    const purchase = await purchases.buy(w.uuid, w.caseId, randomUUID(), 1, null);
    await acknowledge(w.nodes[0], (await commands(w.nodes[0]))[0]);
    await repository('PunishmentPurchase').update({ id: purchase.id }, { expiresAtMs: Date.now() - 1 });
    await tasks.tick(); await tasks.tick();
    assert.equal((await repository('PunishmentPurchase').findOneByOrFail({ id: purchase.id })).status, 'REFUNDED');
    assert.equal(await balance(w.uuid), 1000);
    assert.equal((await repository('PunishmentBinding').findOneByOrFail({ caseId: w.caseId, streamId: w.nodes[0].streamId })).status, 'ABSENT');
  });

  it('keeps reserve after one day, rejects unconfirmed completion and audits justified refund', async () => {
    const w = await appliedGroup();
    const purchase = await purchases.buy(w.uuid, w.caseId, randomUUID(), 1, null);
    await repository('PunishmentPurchase').update({ id: purchase.id }, { createdAt: new Date(Date.now() - 86_400_001) });
    await tasks.tick();
    assert.equal((await repository('PunishmentPurchase').findOneByOrFail({ id: purchase.id })).status, 'REVIEW');
    await assert.rejects(purchases.resolve(purchase.id, 'COMPLETE', 'Check', actor.user.uuid), /подтверждение/);
    await purchases.resolve(purchase.id, 'REFUND', 'Confirmed compensation', actor.user.uuid);
    await purchases.resolve(purchase.id, 'REFUND', 'Repeated request', actor.user.uuid);
    assert.equal(await balance(w.uuid), 1000);
    assert.equal(await repository('PunishmentAudit').countBy({ caseId: w.caseId, action: 'purchase.refund.authorized' }), 1);
    assert.equal((await commands(w.nodes[1])).length, 1);
  });

  it('updates membership, removes only group copies and ignores late events from replaced copies', async () => {
    const w = await appliedGroup();
    const old = await repository('GamePunishment').findOneByOrFail({ caseId: w.caseId, streamId: w.nodes[1].streamId });
    let group = await groups.save({ ...w.group, members: [w.group.members[0], { streamId: w.nodes[2].streamId, providerId: 'vanilla', primaryKinds: [] }] }, actor.user.uuid);
    await acknowledge(w.nodes[1], (await commands(w.nodes[1]))[0]);
    await acknowledge(w.nodes[2], (await commands(w.nodes[2]))[0]);
    group = await groups.save({ ...group, members: [...group.members, w.group.members[1]] }, actor.user.uuid);
    const next = (await commands(w.nodes[1]))[0];
    assert.equal(next.revoke, false);
    await acknowledge(w.nodes[1], next);
    await protocol.events({ ...w.nodes[1].connection, events: [{ eventId: randomUUID(), punishment: { ...old.payload, status: 'REVOKED' } }] }, token);
    assert.equal((await repository('PunishmentCase').findOneByOrFail({ id: w.caseId })).desired, 'ACTIVE');
    assert.equal((await repository('PunishmentBinding').findOneByOrFail({ caseId: w.caseId, streamId: w.nodes[1].streamId })).status, 'APPLIED');
  });

  it('keeps legacy account blocks separate and does not remove a later independent account block', async () => {
    const uuid = await user();
    await db.getRepository(mod.Ban).save({ userUuid: uuid, reason: 'Legacy' });
    await tasks.tick();
    const ban = await repository('Ban').findOneByOrFail({ userUuid: uuid });
    const item = await repository('PunishmentCase').findOneByOrFail({ id: ban.punishmentId });
    assert.equal(item.category, 'ACCOUNT');
    const replacement = await accounts.save({ userUuid: uuid, reason: 'New account restriction' });
    await db.transaction(async (manager) => { await mod.lockPunishments(manager); await accounts.revoke(manager, item.id); });
    assert.equal((await repository('Ban').findOneByOrFail({ userUuid: uuid })).punishmentId, replacement.punishmentId);
    const feed = await views.list({ subjectUuid: uuid, kind: 'BAN', tab: 'history' });
    assert.equal(feed.counters.history, 1);
    assert.ok(!JSON.stringify(feed).includes('password'));
    assert.ok(!JSON.stringify(feed).includes('private'));
  });

  it('blocks purchase per punishment and preserves audit and moderator hierarchy', async () => {
    const w = await appliedGroup();
    const item = await admin.sale(actor, w.caseId, { revision: 1, blocked: true, reason: 'Appeal required' });
    await assert.rejects(purchases.buy(w.uuid, w.caseId, randomUUID(), item.revision, null), /Appeal required/);
    assert.equal(await balance(w.uuid), 1000);
    assert.equal(await repository('PunishmentAudit').countBy({ caseId: w.caseId, action: 'sale.changed' }), 1);
  });

  it('failed verification keeps the original unknown issuance fenced from retry', async () => {
    const w = await world();
    const row = await native(w.nodes[0], w.uuid);
    const command = (await commands(w.nodes[1]))[0];
    await protocol.acknowledge({ ...w.nodes[1].connection, commandId: command.commandId, result: { status: 'UNKNOWN' } }, token);
    let binding = await repository('PunishmentBinding').findOneByOrFail({ caseId: row.caseId, streamId: w.nodes[1].streamId });
    assert.equal(binding.status, 'UNKNOWN');
    const verification = await admin.verify(actor, row.caseId, binding.id, 'incorrect-native-id', 'Operator check');
    await protocol.acknowledge({ ...w.nodes[1].connection, commandId: verification.commandId, result: { status: 'FAILED', message: 'Not found' } }, token);
    binding = await repository('PunishmentBinding').findOneByOrFail({ id: binding.id });
    assert.equal(binding.status, 'UNKNOWN');
    assert.equal(binding.issueCommandId, command.commandId);
    await assert.rejects(admin.retry(actor, row.caseId, binding.id), /подтверждённой/);
    assert.equal((await commands(w.nodes[1])).length, 0);
  });

  it('explicit transfer is previewed, revision fenced and does not grant group rights from local access', async () => {
    const w = await world();
    const row = await native(w.nodes[0], w.uuid, 'SNAPSHOT');
    const preview = await admin.transfer(actor, row.caseId, { revision: 1, groupId: w.group.id, confirm: false });
    assert.equal(preview.preview.add.length, 1);
    await assert.rejects(admin.transfer(actor, row.caseId, { revision: 1, groupId: w.group.id, groupRevision: 999, confirm: true }), /Состав группы/);
    assert.equal((await commands(w.nodes[1])).length, 0);
    const scoped = { user: { uuid: actor.user.uuid, perms: [`panel.punishments.revoke.instance:${w.nodes[0].streamId}`] } };
    assert.equal(await access.allows(scoped, 'revoke', await repository('PunishmentCase').findOneByOrFail({ id: row.caseId })), true);
    await admin.transfer(actor, row.caseId, { revision: 1, groupId: w.group.id, groupRevision: preview.preview.groupRevision, confirm: true });
    assert.equal(await access.allows(scoped, 'revoke', await repository('PunishmentCase').findOneByOrFail({ id: row.caseId })), false);
    assert.equal((await commands(w.nodes[1])).length, 1);
  });

  it('account unban is idempotent and uses the preserved account price without game commands', async () => {
    const uuid = await user();
    const ban = await accounts.save({ userUuid: uuid, reason: 'Account' });
    const requestId = randomUUID();
    const bought = await purchases.buy(uuid, ban.punishmentId, requestId, 1, null);
    assert.equal(bought.status, 'COMPLETED');
    assert.equal(bought.amount, 75);
    await purchases.buy(uuid, ban.punishmentId, requestId, 1, null);
    assert.equal(await balance(uuid), 925);
    assert.equal(await repository('Ban').countBy({ userUuid: uuid }), 0);
    assert.equal(await repository('PunishmentCase').countBy({ subjectUuid: uuid, category: 'GAME' }), 0);
  });

  it('public feeds include unknown players, exclude IP subjects and split active from expired history immediately', async () => {
    const w = await world();
    const unknown = randomUUID();
    await native(w.nodes[0], unknown, 'SNAPSHOT', { actor: { name: 'RemoteModerator', console: false } });
    await native(w.nodes[0], unknown, 'SNAPSHOT', { externalId: randomUUID(), issuedAtMs: Date.now() - 1000, expiresAtMs: Date.now() - 1 });
    await native(w.nodes[0], w.uuid, 'SNAPSHOT', { subject: { kind: 'IP', value: '192.0.2.1' } }).catch((failure) => { if (!String(failure).includes('Could not find')) throw failure; });
    const active = await views.list({ subjectUuid: unknown });
    const history = await views.list({ subjectUuid: unknown, tab: 'history' });
    assert.equal(active.counters.active, 1);
    assert.equal(active.counters.history, 1);
    assert.equal(active.data[0].user, null);
    assert.equal(active.data[0].actorName, 'RemoteModerator');
    assert.equal(history.data[0].status, 'EXPIRED');
    assert.ok(!JSON.stringify(await views.list({})).includes('192.0.2.1'));
  });

  it('converts account blocks only after the previewed targets confirm, with safe request replay', async () => {
    const w = await world();
    const ban = await accounts.save({ userUuid: w.uuid, reason: 'Account conversion' });
    const input = { requestId: randomUUID(), subjectUuid: w.uuid, kind: 'BAN', reason: 'Ignored', scopeType: 'GROUP', scopeId: w.group.id, revision: 1, confirm: false };
    const preview = await admin.convertAccount(actor, ban.punishmentId, 1, input, false);
    const confirmed = { ...input, confirm: true, previewToken: preview.preview.previewToken };
    const converted = await admin.convertAccount(actor, ban.punishmentId, 1, confirmed, true);
    assert.equal(await repository('Ban').countBy({ userUuid: w.uuid }), 1);
    await acknowledge(w.nodes[0], (await commands(w.nodes[0]))[0]);
    await tasks.tick();
    assert.equal(await repository('Ban').countBy({ userUuid: w.uuid }), 1);
    await acknowledge(w.nodes[1], (await commands(w.nodes[1]))[0]);
    await tasks.tick();
    assert.equal(await repository('Ban').countBy({ userUuid: w.uuid }), 0);
    assert.equal((await admin.convertAccount(actor, ban.punishmentId, 1, confirmed, true)).id, converted.id);
    assert.equal(await repository('PunishmentCase').countBy({ migrationFromId: ban.punishmentId }), 1);
  });

  it('does not release an account when its conversion group has no active members', async () => {
    const w = await world();
    const ban = await accounts.save({ userUuid: w.uuid, reason: 'Account conversion' });
    const input = { requestId: randomUUID(), subjectUuid: w.uuid, kind: 'BAN', reason: 'Ignored', scopeType: 'GROUP', scopeId: w.group.id, revision: 1, confirm: false };
    const preview = await admin.convertAccount(actor, ban.punishmentId, 1, input, false);
    await admin.convertAccount(actor, ban.punishmentId, 1, { ...input, confirm: true, previewToken: preview.preview.previewToken }, true);
    await groups.save({ ...w.group, members: [] }, actor.user.uuid);
    await tasks.tick();
    assert.equal(await repository('Ban').countBy({ userUuid: w.uuid }), 1);
  });

  it('never reserves a changed price without a new buyer confirmation', async () => {
    const w = await appliedGroup();
    await groups.save({ ...w.group, unban: { enabled: true, price: 300 } }, actor.user.uuid);
    await assert.rejects(purchases.buy(w.uuid, w.caseId, randomUUID(), 1, null, 150), /Цена разбана изменилась/);
    assert.equal(await balance(w.uuid), 1000);
    assert.equal(await repository('PunishmentPurchase').countBy({ caseId: w.caseId }), 0);
  });

  it('cancels unoffered copies and cleanup when group membership is reversed before delivery', async () => {
    const w = await world();
    const row = await native(w.nodes[0], w.uuid);
    let group = await groups.save({ ...w.group, members: [] }, actor.user.uuid);
    assert.equal((await commands(w.nodes[1])).length, 0);
    group = await groups.save({ ...group, members: w.group.members }, actor.user.uuid);
    assert.equal((await commands(w.nodes[0])).length, 0);
    const copy = (await commands(w.nodes[1]))[0];
    assert.equal(copy.revoke, false);
    await acknowledge(w.nodes[1], copy);
    assert.equal((await repository('PunishmentCase').findOneByOrFail({ id: row.caseId })).desired, 'ACTIVE');
  });

  it('finishes an already offered cleanup after rejoin without revoking the whole group', async () => {
    const w = await appliedGroup();
    let group = await groups.save({ ...w.group, members: [w.group.members[0]] }, actor.user.uuid);
    const cleanup = (await commands(w.nodes[1]))[0];
    assert.equal(cleanup.cleanup, true);
    group = await groups.save({ ...group, members: w.group.members }, actor.user.uuid);
    await acknowledge(w.nodes[1], cleanup);
    const next = (await commands(w.nodes[1]))[0];
    assert.equal(next.revoke, false);
    await acknowledge(w.nodes[1], next);
    assert.equal((await repository('PunishmentCase').findOneByOrFail({ id: w.caseId })).desired, 'ACTIVE');
    assert.equal((await commands(w.nodes[0])).length, 0);
  });

  it('preserves native network scope and requires project authority instead of local moderation rights', async () => {
    const w = await world();
    const row = await native(w.nodes[0], w.uuid, 'LIVE', { groupable: false, scope: { serverId: w.nodes[0].connection.serverId, networkId: '*' } });
    const item = await repository('PunishmentCase').findOneByOrFail({ id: row.caseId });
    assert.equal(item.scopeType, 'NATIVE');
    assert.equal(item.nativeBroad, true);
    assert.equal((await commands(w.nodes[1])).length, 0);
    assert.equal(await access.allows({ user: { perms: [`panel.punishments.revoke.server:${w.nodes[0].connection.serverId}`] } }, 'revoke', item), false);
    assert.equal(await access.allows({ user: { perms: ['panel.punishments.revoke.project'] } }, 'revoke', item), true);
    assert.equal((await views.list({ subjectUuid: w.uuid })).data[0].scope.nativeNetworkId, '*');
    await assert.rejects(admin.transfer(actor, item.id, { revision: 1, groupId: w.group.id, confirm: false }), /область действия/);
  });
});
