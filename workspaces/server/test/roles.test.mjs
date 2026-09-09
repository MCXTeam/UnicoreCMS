import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { closeDatabase } from './helpers/db.mjs';
import { cleanup, createAdmin, createRole, createUser, rootSession } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

const keys = (body) => (body?.permissions || []).map((entry) => entry.key);

describe('Разрешения в роли', () => {
  it('без права на администраторские права роли доступны только возможности игрока', async () => {
    const { session } = await createAdmin(['panel.roles.read', 'panel.roles.update']);

    const { status, body } = await session.get('/admin/permissions/catalog');

    assert.ok(ok(status), `каталог не отдан: ${status}`);
    assert.ok(keys(body).length, 'каталог пуст');
    assert.ok(
      keys(body).every((key) => key.startsWith('player.')),
      `в каталоге есть непанельные права: ${keys(body).join(', ')}`,
    );
  });

  it('панельное право в роль без этого права не записать', async () => {
    const { session } = await createAdmin(['panel.roles.read', 'panel.roles.update', 'panel.users.read']);
    const id = await createRole(['player.donate.group.buy']);

    const { status } = await session.patch(`/admin/roles/${id}`, { name: 'Роль', perms: ['panel.users.read'], priority: 1 });

    assert.equal(status, 403);
  });

  it('игровое право в роль записать можно', async () => {
    const { session } = await createAdmin(['panel.roles.read', 'panel.roles.update']);
    const id = await createRole(['player.donate.group.buy']);

    const { status } = await session.patch(`/admin/roles/${id}`, {
      name: 'Роль',
      perms: ['player.donate.permission.buy'],
      priority: 1,
    });

    assert.ok(ok(status), `игровое право отвергнуто: ${status}`);
  });

  it('с правом на администраторские права видны свои панельные права', async () => {
    const { session } = await createAdmin(['panel.roles.read', 'panel.roles.update', 'panel.roles.grant.panel', 'panel.users.read']);

    const { body } = await session.get('/admin/permissions/catalog');

    assert.ok(keys(body).includes('panel.users.read'), 'своего права нет в каталоге');
    assert.ok(!keys(body).includes('panel.config.update'), 'каталог отдаёт право, которого у выдающего нет');
  });

  it('панельное право в роль со своим правом записывается', async () => {
    const { session } = await createAdmin(['panel.roles.read', 'panel.roles.update', 'panel.roles.grant.panel', 'panel.users.read']);
    const id = await createRole([]);

    const { status } = await session.patch(`/admin/roles/${id}`, { name: 'Роль', perms: ['panel.users.read'], priority: 1 });

    assert.ok(ok(status), `панельное право отвергнуто: ${status}`);
  });

  it('список ролей помечает роль, которую выдать нельзя', async () => {
    const { session } = await createAdmin(['panel.users.read', 'panel.users.update', 'panel.users.grant.panel']);
    const strong = await createRole(['panel.config.read', 'panel.config.update']);
    const weak = await createRole([]);

    const { status, body } = await session.get('/admin/roles');

    assert.ok(ok(status), `список ролей не отдан: ${status}`);

    const byId = new Map((body || []).map((role) => [role.id, role]));

    assert.equal(byId.get(strong)?.grantable, false, 'роль сильнее выдающего помечена выдаваемой');
    assert.equal(byId.get(weak)?.grantable, true, 'пустая роль помечена невыдаваемой');
  });

  it('системную роль удалить нельзя', async () => {
    const admin = await rootSession();

    const { status } = await admin.del('/admin/roles/default');

    assert.equal(status, 400);

    const { body } = await admin.get('/admin/roles');

    assert.ok(
      (body || []).some((role) => role.id === 'default'),
      'роль игрока пропала после попытки удаления',
    );
  });

  it('обычную роль удалить можно', async () => {
    const admin = await rootSession();
    const id = await createRole([]);

    const { status } = await admin.del(`/admin/roles/${id}`);

    assert.ok(status >= 200 && status < 300, `удаление обычной роли отвергнуто: ${status}`);
  });

  it('признак выдачи приходит и без права смотреть роли', async () => {
    const { session } = await createAdmin(['panel.users.read', 'panel.users.update']);
    const strong = await createRole(['panel.config.read', 'panel.config.update']);

    const { body } = await session.get('/admin/roles');
    const role = (body || []).find((item) => item.id === strong);

    assert.deepEqual(role?.perms, [], 'состав роли виден без права смотреть роли');
    assert.equal(role?.grantable, false, 'без права смотреть роли признак выдачи не пришёл');
  });
});

describe('Приоритет ролей', () => {
  const staffPerms = ['panel.users.read', 'panel.users.update', 'panel.users.field.roles', 'panel.users.grant.panel'];

  async function staff(priority) {
    const roleId = await createRole(staffPerms, { priority });

    return createUser({ perms: ['panel.access'], roles: [roleId] });
  }

  it('роль с тем же приоритетом выдать нельзя', async () => {
    const { session } = await staff(5);
    const same = await createRole([], { priority: 5 });

    const { body } = await session.get('/admin/roles');
    const role = (body || []).find((item) => item.id === same);

    assert.equal(role?.grantable, false, 'роль с равным приоритетом помечена выдаваемой');
  });

  it('роль с меньшим приоритетом выдать можно', async () => {
    const { session } = await staff(5);
    const lower = await createRole([], { priority: 4 });

    const { body } = await session.get('/admin/roles');
    const role = (body || []).find((item) => item.id === lower);

    assert.equal(role?.grantable, true, 'роль ниже по приоритету помечена невыдаваемой');
  });

  it('назначение роли не ниже своей отвергается сервером', async () => {
    const { session } = await staff(5);
    const same = await createRole([], { priority: 5 });
    const { username } = await createUser({});
    const target = await rootSession().then((admin) => admin.get(`/users/${username}`));

    const uuid = target.body?.uuid;

    if (!uuid) return;

    const { status } = await session.patch(`/users/${uuid}`, {
      username,
      locale: 'ru',
      roles: [same],
      perms: [],
    });

    assert.equal(status, 403, 'сервер принял роль с равным приоритетом');
  });
});
