import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createAdmin } from './helpers/stand.mjs';

const created = { groups: [], permissions: [] };

let server = null;

let period = null;

before(async () => {
  server = (await query('SELECT id FROM unicore_servers ORDER BY priority ASC LIMIT 1'))[0]?.id ?? null;
  period = (await query('SELECT id FROM unicore_periods ORDER BY id ASC LIMIT 1'))[0]?.id ?? null;
});

after(async () => {
  for (const id of created.groups) {
    await query('DELETE FROM unicore_servers_donate_groups WHERE group_id = ?', [id]).catch(() => null);
    await query('DELETE FROM unicore_donate_groups_periods WHERE group_id = ?', [id]).catch(() => null);
    await query('DELETE FROM unicore_donate_groups WHERE id = ?', [id]).catch(() => null);
  }

  for (const id of created.permissions) {
    await query('DELETE FROM unicore_servers_donate_permissions WHERE permission_id = ?', [id]).catch(() => null);
    await query('DELETE FROM unicore_donate_permissions_periods WHERE permission_id = ?', [id]).catch(() => null);
    await query('DELETE FROM unicore_donate_permissions WHERE id = ?', [id]).catch(() => null);
  }

  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

const uniqueName = () => `e2e-${Math.random().toString(36).slice(2, 10)}`;

const groupBody = (extra = {}) => ({
  name: uniqueName(),
  description: 'тест',
  price: 100,
  sale: 0,
  ingame_id: uniqueName(),
  web_perms: [],
  features: [],
  virtual_percent: 0,
  servers: [server],
  periods: period ? [period] : [],
  kits: [],
  ...extra,
});

const permissionBody = (extra = {}) => ({
  name: uniqueName(),
  type: 'game',
  description: 'тест',
  price: 100,
  sale: 0,
  servers: [server],
  periods: period ? [period] : [],
  perms: ['group.vip'],
  web_perms: [],
  ...extra,
});

describe('Донат в панели', () => {
  it('право на создание групп для одного сервера позволяет создать группу', async () => {
    if (!server) return;

    const { session } = await createAdmin([`panel.donate.read.${server}`, `panel.donate.groups.create.${server}`]);

    const { status, body } = await session.post('/donates/groups', groupBody());

    if (body?.id) created.groups.push(body.id);

    assert.ok(ok(status), `создание группы отвергнуто: ${status} ${JSON.stringify(body)}`);
  });

  it('группу на чужой сервер создать нельзя', async () => {
    const servers = await query('SELECT id FROM unicore_servers ORDER BY priority ASC LIMIT 2');

    if (servers.length < 2) return;

    const [mine, foreign] = servers.map((row) => row.id);
    const { session } = await createAdmin([`panel.donate.read.${mine}`, `panel.donate.groups.create.${mine}`]);

    const { status, body } = await session.post('/donates/groups', groupBody({ servers: [foreign] }));

    if (body?.id) created.groups.push(body.id);

    assert.equal(status, 403);
  });

  it('без права на состав донат-права веб-роль не назначить', async () => {
    if (!server) return;

    const { session } = await createAdmin([`panel.donate.read.${server}`, `panel.donate.permissions.create.${server}`]);

    const { status, body } = await session.post('/donates/permissions', permissionBody({ web_role_id: 'default' }));

    if (body?.id) created.permissions.push(body.id);

    assert.equal(status, 403);
  });

  it('с правом на состав донат-права веб-роль назначается', async () => {
    if (!server) return;

    const { session } = await createAdmin([
      `panel.donate.read.${server}`,
      `panel.donate.permissions.create.${server}`,
      'panel.donate.permissions.field.perms',
    ]);

    const { status, body } = await session.post('/donates/permissions', permissionBody({ web_role_id: 'default' }));

    if (body?.id) created.permissions.push(body.id);

    assert.ok(ok(status), `создание с веб-ролью отвергнуто: ${status} ${JSON.stringify(body)}`);
  });

  it('донат-право без веб-роли создаётся и без этого права', async () => {
    if (!server) return;

    const { session } = await createAdmin([`panel.donate.read.${server}`, `panel.donate.permissions.create.${server}`]);

    const { status, body } = await session.post('/donates/permissions', permissionBody());

    if (body?.id) created.permissions.push(body.id);

    assert.ok(ok(status), `создание без веб-роли отвергнуто: ${status} ${JSON.stringify(body)}`);
  });
});

describe('Веб-донат-права', () => {
  const webBody = (extra = {}) => permissionBody({ type: 'web', servers: undefined, perms: undefined, ...extra });

  const createWeb = async () => {
    const { session } = await createAdmin([
      'panel.donate.read',
      'panel.donate.permissions.create',
      'panel.donate.permissions.web',
    ]);
    const { status, body } = await session.post('/donates/permissions', webBody());

    if (body?.id) created.permissions.push(body.id);

    assert.ok(ok(status), `подготовка веб-права не удалась: ${status} ${JSON.stringify(body)}`);

    return body;
  };

  it('без права на веб-записи запись без серверов не создать', async () => {
    if (!server) return;

    const { session } = await createAdmin([`panel.donate.read.${server}`, `panel.donate.permissions.create.${server}`]);

    const { status, body } = await session.post('/donates/permissions', webBody());

    if (body?.id) created.permissions.push(body.id);

    assert.equal(status, 403);
  });

  it('с правом на веб-записи создание проходит даже при скоупе на один сервер', async () => {
    if (!server) return;

    const { session } = await createAdmin([
      `panel.donate.read.${server}`,
      `panel.donate.permissions.create.${server}`,
      'panel.donate.permissions.web',
    ]);

    const { status, body } = await session.post('/donates/permissions', webBody());

    if (body?.id) created.permissions.push(body.id);

    assert.ok(ok(status), `создание веб-права отвергнуто: ${status} ${JSON.stringify(body)}`);
    assert.equal(body?.type, 'web');
  });

  it('админ со скоупом видит веб-записи в списке', async () => {
    if (!server) return;

    const web = await createWeb();
    const { session } = await createAdmin([`panel.donate.read.${server}`]);

    const { status, body } = await session.get('/donates/permissions');

    assert.ok(ok(status), `список отвергнут: ${status}`);
    assert.ok(
      (body || []).some((item) => item.id === web.id),
      'веб-запись пропала из списка',
    );
  });

  it('без права на веб-записи их нельзя править', async () => {
    if (!server) return;

    const web = await createWeb();
    const { session } = await createAdmin([
      `panel.donate.read.${server}`,
      `panel.donate.permissions.update.${server}`,
    ]);

    const { status } = await session.patch(`/donates/permissions/${web.id}`, webBody({ name: 'Другое имя' }));

    assert.equal(status, 403);
  });

  it('с правом на веб-записи правка проходит', async () => {
    if (!server) return;

    const web = await createWeb();
    const { session } = await createAdmin([
      `panel.donate.read.${server}`,
      `panel.donate.permissions.update.${server}`,
      'panel.donate.permissions.web',
    ]);

    const { status, body } = await session.patch(`/donates/permissions/${web.id}`, webBody({ name: 'Другое имя' }));

    assert.ok(ok(status), `правка веб-права отвергнута: ${status} ${JSON.stringify(body)}`);
  });

  it('без права на веб-записи их нельзя удалить', async () => {
    if (!server) return;

    const web = await createWeb();
    const { session } = await createAdmin([
      `panel.donate.read.${server}`,
      `panel.donate.permissions.delete.${server}`,
    ]);

    const { status } = await session.del(`/donates/permissions/${web.id}`);

    assert.equal(status, 403);
  });

  it('перевод веб-записи на сервер требует права на оба конца', async () => {
    if (!server) return;

    const web = await createWeb();
    const { session } = await createAdmin([
      `panel.donate.read.${server}`,
      `panel.donate.permissions.update.${server}`,
      'panel.donate.permissions.web',
    ]);

    const { status, body } = await session.patch(`/donates/permissions/${web.id}`, permissionBody({ name: 'Стало игровым' }));

    assert.ok(ok(status), `перевод в игровое отвергнут: ${status} ${JSON.stringify(body)}`);
  });
});
