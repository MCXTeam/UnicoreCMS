import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createAdmin, createRole, createUser } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

async function someServer() {
  const rows = await query('SELECT id FROM unicore_servers ORDER BY priority ASC LIMIT 2');

  return rows.map((row) => row.id);
}

describe('Права в панели', () => {
  it('без права раздел не открывается', async () => {
    const { session } = await createAdmin([]);

    const { status } = await session.get('/admin/logs');

    assert.equal(status, 403);
  });

  it('с правом раздел открывается', async () => {
    const { session } = await createAdmin(['panel.logs.read']);

    const { status } = await session.get('/admin/logs');

    assert.ok(ok(status), `журнал отвергнут: ${status}`);
  });

  it('право «удалять» не даёт «удалять списком»', async () => {
    const [server] = await someServer();

    if (!server) return;

    const { session } = await createAdmin([`panel.donate.groups.delete.${server}`, `panel.donate.read.${server}`]);

    const { status } = await session.del('/donates/groups/bulk', { items: [999999] });

    assert.equal(status, 403, 'одиночное удаление открыло массовое');
  });

  it('«удалять списком» на все серверы работает', async () => {
    const { session } = await createAdmin(['panel.donate.groups.delete.many', 'panel.donate.read']);

    const { status } = await session.del('/donates/groups/bulk', { items: [] });

    assert.notEqual(status, 403, 'право на все серверы не сработало');
  });

  it('право на один сервер не открывает другой', async () => {
    const servers = await someServer();

    if (servers.length < 2) return;

    const [first, second] = servers;
    const { session } = await createAdmin([`panel.servers.update.${first}`, 'panel.servers.read']);

    const { status } = await session.get(`/servers/${second}`);

    assert.ok(ok(status), 'чтение сервера должно быть доступно по праву просмотра');

    const denied = await session.patch(`/servers/${second}`, { name: 'x' });

    assert.equal(denied.status >= 400 ? 403 : denied.status, 403, 'правка чужого сервера прошла');
  });

  it('маска panel.* не выдаёт опасные права', async () => {
    const { session } = await createAdmin(['panel.*']);

    const { status } = await session.get('/config');

    assert.equal(status, 403, 'маска выдала опасное право на настройки');
  });

  it('запрет отменяет выданное право', async () => {
    const { session } = await createAdmin(['panel.logs.read', '!panel.logs.read']);

    const { status } = await session.get('/admin/logs');

    assert.equal(status, 403);
  });

  it('право из роли работает так же, как своё', async () => {
    const role = await createRole(['panel.access', 'panel.logs.read']);
    const { session } = await createUser({ roles: [role] });

    const { status } = await session.get('/admin/logs');

    assert.ok(ok(status), `право из роли не сработало: ${status}`);
  });

  it('каталог прав не показывает панельные права без права их выдавать', async () => {
    const { session } = await createAdmin(['panel.logs.read']);

    const { status, body } = await session.get('/admin/permissions/catalog');

    assert.ok(ok(status), `каталог отвергнут: ${status}`);
    assert.ok(
      (body?.permissions || []).every((entry) => entry.key.startsWith('player.')),
      'панельные права видны без права их выдавать',
    );
  });

  it('право «Настраивать права ролей» открывает панельные права в каталоге', async () => {
    const { session } = await createAdmin(['panel.roles.read', 'panel.roles.grant.panel']);

    const { status, body } = await session.get('/admin/permissions/catalog');

    assert.ok(ok(status), `каталог отвергнут: ${status}`);
    assert.ok(
      (body?.permissions || []).some((entry) => entry.key === 'panel.roles.read'),
      'панельные права не появились',
    );
  });
});
