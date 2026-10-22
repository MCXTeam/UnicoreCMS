import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { after, describe, it } from 'node:test';
import { api } from './helpers/env.mjs';
import { login } from './helpers/api.mjs';
import { closeDatabase, query } from './helpers/db.mjs';
import { PASSWORD } from './helpers/stand.mjs';

const require = createRequire(new URL('../../client/package.json', import.meta.url));
const { io } = require('socket.io-client');
const serverId = process.env.CONNECT_LIVE_SERVER || 'liveprobe';

describe('Connect: running CMS and game server', { skip: process.env.CONNECT_LIVE_TEST !== '1' }, () => {
  after(closeDatabase);

  it('returns the same Connect presence for the public list and server page', async () => {
    const list = await fetch(`${api}/servers/online`).then((response) => response.json());
    const row = list.servers.find((item) => item.serverId === serverId);
    assert.equal(row?.source, 'connect');
    assert.equal(row.freshness, 'fresh');
    const server = await fetch(`${api}/servers/${serverId}`).then((response) => response.json());
    assert.equal(server.online?.source, 'connect');
    assert.equal(server.online.players, row.players);
    assert.deepEqual(server.online.playerList, row.playerList);
  });

  it('pushes public online updates to guests and authenticated players', { timeout: 20_000 }, async () => {
    const username = process.env.CONNECT_LIVE_PLAYER || 'UCProbe';
    const player = await login(username, PASSWORD);
    const guest = io(api, { autoConnect: false, transports: ['websocket'], forceNew: true });
    const authenticated = io(api, { autoConnect: false, transports: ['websocket'], forceNew: true, auth: { token: player.refreshToken || player.jar.unicore_refresh } });
    let guestUpdates = 0;
    let authenticatedUpdates = 0;
    guest.on('servers/online', () => guestUpdates++);
    authenticated.on('servers/online', () => authenticatedUpdates++);
    try {
      await Promise.all([guest, authenticated].map((socket) => new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Socket identity timeout')), 5000);
        socket.once('me', (user) => {
          clearTimeout(timeout);
          if (socket === authenticated && user?.username !== username) reject(new Error('Player socket was not authenticated'));
          else resolve();
        });
        socket.connect();
      })));
      await new Promise((resolve) => setTimeout(resolve, 6500));
      assert.ok(guestUpdates > 0, 'Guest did not receive an online broadcast');
      assert.ok(authenticatedUpdates > 0, 'Authenticated player did not receive an online broadcast');
    } finally {
      guest.disconnect();
      authenticated.disconnect();
    }
  });

  it('does not recount a real closed session when its checkpoint is replayed', { skip: !process.env.CONNECT_LIVE_CONFIG }, async () => {
    const config = JSON.parse(await readFile(process.env.CONNECT_LIVE_CONFIG, 'utf8'));
    const [saved] = await query(
      'SELECT s.*, i.server_id, i.instance_id, i.boot_id, i.epoch FROM unicore_connect_sessions s JOIN unicore_connect_instances i ON i.id = s.stream_id WHERE i.server_id = ? AND s.closed = 1 LIMIT 1',
      [serverId],
    );
    assert.ok(saved, 'A completed game session is required');
    const checkpoint = { sessionId: saved.session_id, userUuid: saved.user_uuid, sequence: Number(saved.sequence), connectedMs: Number(saved.connected_ms), activeMs: Number(saved.active_ms), closed: true };
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(`${api}/connect/v2/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Api-Key ${config.apiKey}` },
        body: JSON.stringify({ serverId, instanceId: saved.instance_id, bootId: saved.boot_id, epoch: Number(saved.epoch), sessions: [checkpoint] }),
      });
      assert.equal(response.status, 201);
      assert.deepEqual((await response.json()).accepted, [{ sessionId: checkpoint.sessionId, sequence: checkpoint.sequence }]);
    }
    const [total] = await query(
      'SELECT p.connected_ms, p.active_ms, SUM(s.connected_ms) AS session_connected, SUM(s.active_ms) AS session_active FROM unicore_connect_playtimes p JOIN unicore_connect_instances i ON i.server_id = p.server_id JOIN unicore_connect_sessions s ON s.stream_id = i.id AND s.user_uuid = p.user_uuid WHERE p.server_id = ? AND p.user_uuid = ? GROUP BY p.id',
      [serverId, checkpoint.userUuid],
    );
    assert.equal(Number(total.connected_ms), Number(total.session_connected));
    assert.equal(Number(total.active_ms), Number(total.session_active));
  });
});
