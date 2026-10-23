import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { compileConnect } from './helpers/compile-connect.mjs';

describe('Connect v2: MariaDB transactions', { skip: process.env.CONNECT_TEST_DB !== '1' }, () => {
  let directory, mod, db, identity, sessions, presence, punishments;
  const token = 'a'.repeat(64);
  const userUuid = randomUUID();
  const unknownUuid = randomUUID();
  const connection = { serverId: 'contract', instanceId: randomUUID(), bootId: randomUUID(), epoch: 0 };
  before(async () => {
    directory = await mkdtemp(join(tmpdir(), 'unicore-connect-db-'));
    const compiled = await compileConnect(directory);
    mod = compiled.module;
    compiled.require('reflect-metadata');
    const { DataSource } = compiled.require('typeorm');
    const metadata = compiled.require('typeorm').getMetadataArgsStorage();
    const entities = metadata.tables.map((row) => row.target).filter((type) => typeof type === 'function');
    db = new DataSource({ type: 'mariadb', host: '127.0.0.1', port: Number(process.env.CONNECT_TEST_PORT || 13316), username: 'root', password: '', database: 'connect_contracts', entities, synchronize: true, dropSchema: true, timezone: 'Z', extra: { connectionLimit: 8 } });
    await db.initialize();
    await db.query('INSERT INTO unicore_servers (id) VALUES (?)', ['contract']);
    await db.query('INSERT INTO unicore_users (uuid,username) VALUES (?,?)', [userUuid, 'Player']);
    await db.query('INSERT INTO unicore_playtimes (serverId,userUuid,time) VALUES (?,?,10)', ['contract', userUuid]);
    identity = new mod.ConnectIdentityService(db);
    sessions = new mod.ConnectSessionsService(identity, { del: async () => {} });
    presence = new mod.ConnectPresenceService(identity, db);
    const delivery = new mod.PunishmentDeliveryService();
    punishments = new mod.GamePunishmentsService(identity, db, new mod.PunishmentCoordinator(delivery), delivery, new mod.PunishmentAccess(db, delivery));
    connection.epoch = (await identity.register(connection, token)).epoch;
  });
  after(async () => { if (db?.isInitialized) await db.destroy(); if (directory) await rm(directory, { recursive: true, force: true }); });

  it('serializes concurrent replays, preserves baseline and unknown UUIDs', async () => {
    const checkpoint = { sessionId: randomUUID(), userUuid, sequence: 1, connectedMs: 90_000, activeMs: 60_000, closed: false };
    const input = { ...connection, sessions: [checkpoint] };
    await Promise.all(Array.from({ length: 6 }, () => sessions.update(input, token)));
    const total = await db.getRepository(mod.ConnectPlaytime).findOneByOrFail({ userUuid });
    assert.equal(total.baselineMs, 600_000);
    assert.equal(total.connectedMs, 90_000);
    assert.equal(total.activeMs, 60_000);
    assert.equal((await db.query('SELECT time FROM unicore_playtimes WHERE userUuid=?', [userUuid]))[0].time, 11);
    await sessions.update({ ...connection, sessions: [{ ...checkpoint, sessionId: randomUUID(), userUuid: unknownUuid, closed: true }] }, token);
    assert.equal((await db.getRepository(mod.ConnectPlaytime).findOneByOrFail({ userUuid: unknownUuid })).activeMs, 60_000);
  });

  it('rolls back the whole batch on a regressing checkpoint', async () => {
    const stored = await db.getRepository(mod.ConnectSession).findOneByOrFail({ userUuid });
    const newId = randomUUID();
    await assert.rejects(sessions.update({ ...connection, sessions: [{ sessionId: newId, userUuid, sequence: 1, connectedMs: 1000, activeMs: 1000, closed: true }, { ...stored, sequence: 2, connectedMs: 1 }] }, token));
    assert.equal(await db.getRepository(mod.ConnectSession).countBy({ sessionId: newId }), 0);
    assert.equal((await db.getRepository(mod.ConnectPlaytime).findOneByOrFail({ userUuid })).activeMs, 60_000);
  });

  it('fences old boots and rejects another token', async () => {
    const old = { ...connection };
    connection.bootId = randomUUID();
    connection.epoch = (await identity.register(connection, token)).epoch;
    await assert.rejects(sessions.update({ ...old, sessions: [] }, token), /Stale/);
    await assert.rejects(identity.register(connection, 'b'.repeat(64)), /another API/);
  });

  it('recovers a lost registration ACK after the lease and retires only with scope authorization', async () => {
    const stranded = { ...connection, instanceId: randomUUID(), bootId: randomUUID(), epoch: 0 };
    await identity.register(stranded, token);
    const id = identity.streamId(stranded);
    await db.getRepository(mod.ConnectInstance).update({ id }, { registeredAt: new Date(Date.now() - 46_000), retired: true });
    await assert.rejects(identity.register({ ...stranded, bootId: randomUUID() }, token), /retired/);
    await db.getRepository(mod.ConnectInstance).update({ id }, { retired: false });
    const recovered = { ...stranded, bootId: randomUUID() };
    recovered.epoch = (await identity.register(recovered, token)).epoch;
    assert.equal(recovered.epoch, 2);
    await assert.rejects(identity.retire(id, async () => { throw new Error('Forbidden scope'); }), /Forbidden scope/);
    assert.equal((await db.getRepository(mod.ConnectInstance).findOneByOrFail({ id })).retired, false);
    await identity.retire(id, async (serverId) => { assert.equal(serverId, 'contract'); });
    await assert.rejects(sessions.update({ ...recovered, sessions: [] }, token), /Unknown Connect/);
  });

  it('deduplicates identities and conceals vanish across instances', async () => {
    const second = { ...connection, instanceId: randomUUID(), bootId: randomUUID(), epoch: 0 };
    second.epoch = (await identity.register(second, token)).epoch;
    const player = { uuid: userUuid, name: 'Player', activity: 'AFK', visibility: 'VISIBLE' };
    await presence.update({ ...connection, sequence: 1, observedAtMs: Date.now(), maxPlayers: 100, players: [player] }, token);
    await presence.update({ ...second, sequence: 1, observedAtMs: Date.now(), maxPlayers: 100, players: [player] }, token);
    assert.equal((await presence.views(['contract'])).get('contract').players, 1);
    await presence.update({ ...second, sequence: 2, observedAtMs: Date.now(), maxPlayers: 100, players: [{ ...player, visibility: 'HIDDEN' }] }, token);
    const result = (await presence.views(['contract'])).get('contract');
    assert.equal(result.players, 0);
    assert.ok(!JSON.stringify(result).includes(userUuid));
  });

  it('deduplicates punishment events, prevents resurrection, binds command delivery', async () => {
    const punishment = { id: 'source:1', providerId: 'vanilla', externalId: '1', subject: { kind: 'PLAYER', value: userUuid }, kind: 'BAN', scope: { serverId: 'contract' }, reason: 'Rule', actor: { console: true }, issuedAtMs: Date.now(), status: 'ACTIVE', revision: 0 };
    const event = { eventId: randomUUID(), punishment };
    await punishments.events({ ...connection, events: [event] }, token);
    await punishments.events({ ...connection, events: [event] }, token);
    let row = await db.getRepository(mod.GamePunishment).findOneByOrFail({ subjectUuid: userUuid });
    assert.equal(row.revision, 1);
    const commandId = randomUUID();
    await punishments.enqueue({ uuid: randomUUID(), username: 'Admin', superuser: true }, { commandId, punishment: { ...row.payload, revision: row.revision }, revoke: true, expectedRevision: row.revision });
    const other = (await db.getRepository(mod.ConnectInstance).findBy({ serverId: 'contract', retired: false })).find((instance) => instance.instanceId !== connection.instanceId);
    assert.ok(other);
    assert.equal((await punishments.poll({ serverId: other.serverId, instanceId: other.instanceId, bootId: other.bootId, epoch: other.epoch, providerId: 'vanilla' }, token)).commands.length, 0);
    assert.equal((await punishments.poll({ ...connection, providerId: 'vanilla' }, token)).commands.length, 1);
    await punishments.acknowledge({ ...connection, commandId, result: { status: 'UNKNOWN' } }, token);
    assert.equal((await punishments.poll({ ...connection, providerId: 'vanilla' }, token)).commands.length, 0);
    await punishments.events({ ...connection, events: [{ eventId: randomUUID(), punishment: { ...punishment, status: 'REVOKED' } }] }, token);
    await punishments.events({ ...connection, events: [{ eventId: randomUUID(), punishment }] }, token);
    row = await db.getRepository(mod.GamePunishment).findOneByOrFail({ subjectUuid: userUuid });
    assert.equal(row.payload.status, 'REVOKED');
  });

  it('checks stored punishment target when a revoke payload forges the UUID', async () => {
    const protectedUuid = randomUUID();
    await db.query('INSERT INTO unicore_users (uuid,username,superuser) VALUES (?,?,1)', [protectedUuid, 'Protected']);
    const punishment = { id: 'source:protected', providerId: 'vanilla', externalId: 'protected', subject: { kind: 'PLAYER', value: protectedUuid }, kind: 'BAN', scope: { serverId: 'contract' }, reason: 'Rule', issuedAtMs: Date.now(), status: 'ACTIVE', revision: 0 };
    await punishments.events({ ...connection, events: [{ eventId: randomUUID(), punishment }] }, token);
    const row = await db.getRepository(mod.GamePunishment).findOneByOrFail({ subjectUuid: protectedUuid });
    await assert.rejects(punishments.enqueue({ uuid: userUuid, username: 'Moderator', superuser: false }, { commandId: randomUUID(), punishment: { ...row.payload, subject: { kind: 'PLAYER', value: userUuid } }, revoke: true, expectedRevision: row.revision }), /Forbidden/);
    await assert.rejects(punishments.enqueue({ uuid: userUuid, username: 'Admin', superuser: true }, { commandId: randomUUID(), punishment: { ...punishment, subject: { kind: 'PLAYER', value: userUuid } }, revoke: false }), /Choose one/);
  });
});
