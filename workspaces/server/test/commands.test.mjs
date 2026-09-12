import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createUser } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

const PLUGIN_MODE = 0;

async function pluginServer() {
  const rows = await query('SELECT id FROM unicore_servers WHERE delivery_mode = ? LIMIT 1', [PLUGIN_MODE]);

  return rows[0]?.id ?? null;
}

describe('Команды для UnicoreConnect', () => {
  it('плагин забирает команды своего сервера и подтверждает их', async () => {
    const server = await pluginServer();

    if (!server) return;

    const label = `e2e-${Math.random().toString(36).slice(2, 8)}`;

    await query(
      'INSERT INTO unicore_rcon_commands (server_id, command, label, kind, transport, status, attempts) VALUES (?, ?, ?, ?, ?, 0, 0)',
      [server, 'say проверка доставки', label, 'e2e_commands', 'plugin'],
    );

    const { session } = await createUser({ perms: ['kernel.connect'] });
    const taken = await session.get(`/rcon/${server}/commands`);

    assert.ok(ok(taken.status), `команды не отданы плагину: ${taken.status}`);

    const mine = (taken.body || []).find((item) => item.command === 'say проверка доставки');

    assert.ok(mine, 'команда не попала в выдачу для плагина');

    const acked = await session.post(`/rcon/${server}/commands/ack`, { done: [mine.id] });

    assert.ok(ok(acked.status), `подтверждение не принято: ${acked.status}`);

    const rows = await query('SELECT status FROM unicore_rcon_commands WHERE id = ?', [mine.id]);

    assert.equal(Number(rows[0]?.status), 1, 'команда не помечена отправленной');

    const again = await session.get(`/rcon/${server}/commands`);

    assert.ok(!(again.body || []).some((item) => item.id === mine.id), 'подтверждённая команда выдана повторно');

    await query('DELETE FROM unicore_rcon_commands WHERE label = ?', [label]);
  });

  it('команды для плагина не попадают в очередь RCON', async () => {
    const server = await pluginServer();

    if (!server) return;

    const label = `e2e-${Math.random().toString(36).slice(2, 8)}`;

    await query(
      'INSERT INTO unicore_rcon_commands (server_id, command, label, kind, transport, status, attempts) VALUES (?, ?, ?, ?, ?, 0, 0)',
      [server, 'say только через плагин', label, 'e2e_commands', 'plugin'],
    );

    await new Promise((resolve) => setTimeout(resolve, 12000));

    const rows = await query('SELECT status, attempts FROM unicore_rcon_commands WHERE label = ?', [label]);

    assert.equal(Number(rows[0]?.status), 0, 'RCON-воркер забрал команду плагина');
    assert.equal(Number(rows[0]?.attempts), 0, 'по команде плагина были попытки RCON');

    await query('DELETE FROM unicore_rcon_commands WHERE label = ?', [label]);
  });

  it('без права kernel.connect команды не отдаются', async () => {
    const server = await pluginServer();

    if (!server) return;

    const { session } = await createUser({});
    const { status } = await session.get(`/rcon/${server}/commands`);

    assert.equal(status, 403);
  });
});
