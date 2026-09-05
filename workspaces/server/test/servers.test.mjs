import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createAdmin } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

async function firstServer() {
  const rows = await query('SELECT id FROM unicore_servers ORDER BY priority ASC LIMIT 1');

  return rows[0]?.id ?? null;
}

describe('Серверы в панели', () => {
  it('правка переводов доступна по праву правки без права создания', async () => {
    const id = await firstServer();

    if (!id) return;

    const { session } = await createAdmin([`panel.servers.update.${id}`, 'panel.servers.read']);

    const { status } = await session.patch(`/content-translations/server/${id}`, { translations: {} });

    assert.ok(ok(status), `сохранение переводов отвергнуто: ${status}`);
  });

  it('чтение переводов доступно по праву просмотра', async () => {
    const id = await firstServer();

    if (!id) return;

    const { session } = await createAdmin(['panel.servers.read']);

    const { status } = await session.get(`/content-translations/server/${id}`);

    assert.ok(ok(status), `чтение переводов отвергнуто: ${status}`);
  });

  it('без прав на серверы переводы закрыты', async () => {
    const id = await firstServer();

    if (!id) return;

    const { session } = await createAdmin([]);

    const { status } = await session.get(`/content-translations/server/${id}`);

    assert.equal(status, 403);
  });

  it('сортировка серверов требует своего права', async () => {
    const id = await firstServer();

    if (!id) return;

    const denied = await createAdmin([`panel.servers.update.${id}`, 'panel.servers.read']);

    const { status } = await denied.session.post('/servers/sort', { items: [] });

    assert.equal(status, 403, 'сортировка открылась без своего права');
  });

  it('с правом сортировки порядок меняется', async () => {
    const id = await firstServer();

    if (!id) return;

    const { session } = await createAdmin(['panel.servers.read', 'panel.servers.sort']);

    const { status } = await session.post('/servers/sort', { items: [{ id, priority: 0 }] });

    assert.ok(ok(status), `сортировка отвергнута: ${status}`);
  });

  it('настройка выдачи RCON требует своего права', async () => {
    const denied = await createAdmin(['panel.servers.read']);

    const { status } = await denied.session.get('/config');

    assert.equal(status, 403);
  });

  it('право на выдачу RCON открывает настройки выдачи', async () => {
    const { session } = await createAdmin(['panel.servers.read', 'panel.servers.issuance']);

    const { status } = await session.get('/config');

    assert.ok(ok(status), `настройки выдачи отвергнуты: ${status}`);
  });
});
