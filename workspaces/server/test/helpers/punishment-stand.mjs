import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { api } from './env.mjs';
import { query } from './db.mjs';
import { createUser, rootSession } from './stand.mjs';

export async function punishmentStand() {
  const root = await rootSession();
  const player = await createUser();
  const me = await player.session.get('/auth/me');
  assert.equal(me.status, 200);
  const uuid = me.body.user.uuid;
  await query('UPDATE unicore_users SET `real` = 1000 WHERE uuid = ?', [uuid]);
  const server = { id: `pcontract${randomUUID().replaceAll('-','')}` };
  const created = await root.post('/servers', { id: server.id, name: 'Punishment protocol fixture', version: 'contract', query: { host: '127.0.0.1', port: 1 }, table: [] });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const token = await root.post('/admin/api', { comment: `punishment-contract-${uuid}`, perms: ['kernel.connect'], allow: ['127.0.0.1', '::1'], servers: [server.id] });
  assert.equal(token.status, 201);
  const kernel = async (path, body, expected = 201) => {
    const response = await fetch(`${api}/connect/v2${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Api-Key ${token.body.key}` }, body: JSON.stringify(body) });
    const data = await response.json();
    assert.equal(response.status, expected, `${path}: ${JSON.stringify(data)}`);
    return data;
  };
  const nodes = [];
  for (let i = 0; i < 2; i++) {
    const connection = { serverId: server.id, instanceId: randomUUID(), bootId: randomUUID(), epoch: 0 };
    connection.epoch = (await kernel('/register', connection)).epoch;
    const streamId = createHash('sha256').update(JSON.stringify([server.id, connection.instanceId])).digest('hex');
    await kernel('/punishments/poll', { ...connection, providerId: 'vanilla', mode: 'bidirectional', descriptor: { id: 'vanilla', version: 'contract', capabilities: { kinds: ['BAN','MUTE'], issueKinds: ['BAN','MUTE'], revokeKinds: ['BAN','MUTE'], timedKinds: ['BAN','MUTE'], permanentKinds: ['BAN','MUTE'], subjects: ['PLAYER'], exactRevoke: true } } });
    nodes.push({ connection, streamId, providerId: 'vanilla', primaryKinds: ['BAN','MUTE'] });
  }
  const groupId = `contract-${randomUUID()}`;
  const group = await root.put('/punishments/admin/groups', { id: groupId, name: 'HiTech и HiTech-2', kinds: ['BAN','MUTE'], members: nodes.map(({ streamId, providerId, primaryKinds }) => ({ streamId, providerId, primaryKinds })), enabled: true, unban: { enabled: true, price: 150 }, revision: 0 });
  assert.equal(group.status, 200, JSON.stringify(group.body));
  const native = { id: 'native', providerId: 'vanilla', externalId: randomUUID(), subject: { kind: 'PLAYER', value: uuid }, kind: 'BAN', scope: { serverId: server.id }, reason: 'Нарушение правил сервера: повторное использование запрещённых модификаций', actor: { name: 'Moderator', console: false }, issuedAtMs: Date.now(), status: 'ACTIVE', revision: 0 };
  await kernel('/punishments/events', { ...nodes[0].connection, events: [{ eventId: randomUUID(), origin: 'LIVE', punishment: native }] });
  const poll = async (node) => kernel('/punishments/poll', { ...node.connection, providerId: 'vanilla' });
  const acknowledge = async (node, command, observe = true) => {
    const externalId = command.revoke ? command.punishment.externalId : randomUUID();
    const observed = { ...command.punishment, externalId, status: command.revoke ? 'REVOKED' : 'ACTIVE' };
    await kernel('/punishments/ack', { ...node.connection, commandId: command.commandId, result: { status: 'APPLIED', externalId, ...(observe ? { observed } : {}) } });
    return observed;
  };
  await acknowledge(nodes[1], (await poll(nodes[1])).commands[0]);
  const feed = await player.session.get('/cabinet/punishments');
  assert.equal(feed.status, 200, JSON.stringify(feed.body));
  const item = feed.body.data.find((row) => row.scope.id === groupId);
  assert.ok(item, JSON.stringify(feed.body));
  const cleanup = async () => {
    for (const node of nodes) await root.post(`/connect/v2/instances/${node.streamId}/retire`).catch(() => {});
    await root.del(`/admin/api/${token.body.secret}`).catch(() => {});
    await query('DELETE FROM unicore_game_punishment_events WHERE punishment_id IN (SELECT id FROM unicore_game_punishments WHERE subject_uuid = ?)', [uuid]);
    await query('DELETE FROM unicore_game_punishments WHERE subject_uuid = ?', [uuid]);
    for (const table of ['unicore_game_punishment_commands', 'unicore_punishment_bindings', 'unicore_punishment_purchases', 'unicore_punishment_audit'])
      await query(`DELETE FROM ${table} WHERE case_id IN (SELECT id FROM unicore_punishment_cases WHERE subject_uuid = ?)`, [uuid]);
    await query('DELETE FROM unicore_punishment_cases WHERE subject_uuid = ?', [uuid]);
    await query('DELETE FROM unicore_punishment_groups WHERE id = ?', [groupId]);
    for (const node of nodes) {
      await query('DELETE FROM unicore_punishment_providers WHERE stream_id = ?', [node.streamId]);
      await query('DELETE FROM unicore_connect_instances WHERE id = ?', [node.streamId]);
    }
    await root.del(`/servers/${server.id}`);
  };
  return { root, player, uuid, serverId: server.id, group: group.body, nodes, item, native, kernel, poll, acknowledge, cleanup };
}
