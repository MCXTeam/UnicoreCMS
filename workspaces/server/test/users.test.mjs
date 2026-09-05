import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { closeDatabase } from './helpers/db.mjs';
import { PASSWORD, cleanup, createAdmin, createUser, uniqueUsername } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

const newUser = (extra = {}) => {
  const username = uniqueUsername();

  return { username, email: `${username}@example.com`, password: PASSWORD, ...extra };
};

describe('Пользователи в панели', () => {
  it('заводить пользователей можно без права на почту и активацию', async () => {
    const { session } = await createAdmin(['panel.users.read', 'panel.users.create']);

    const { status, body } = await session.post('/users', newUser({ email: `${uniqueUsername()}@example.com`, activated: true }));

    assert.ok(ok(status), `создание отвергнуто: ${status} ${JSON.stringify(body)}`);
  });

  it('без права на создание завести пользователя нельзя', async () => {
    const { session } = await createAdmin(['panel.users.read']);

    const { status } = await session.post('/users', newUser());

    assert.equal(status, 403);
  });

  it('право «Назначать владельца» позволяет выдать владельца', async () => {
    const { session } = await createAdmin([
      'panel.users.read',
      'panel.users.update',
      'panel.users.field.superuser',
      'panel.users.field.roles',
    ]);
    const target = await createUser();

    const { status, body } = await session.patch(`/users/${(await targetUuid(session, target.username)) ?? ''}`, {
      username: target.username,
      superuser: true,
    });

    assert.ok(ok(status), `назначение владельца отвергнуто: ${status} ${JSON.stringify(body)}`);
    assert.equal(body?.superuser, true, 'владелец не назначен');
  });

  it('право «Назначать владельца» позволяет снять владельца', async () => {
    const { session } = await createAdmin([
      'panel.users.read',
      'panel.users.update',
      'panel.users.field.superuser',
      'panel.users.field.roles',
    ]);
    const target = await createUser({ superuser: true });
    const uuid = await targetUuid(session, target.username);

    const { status, body } = await session.patch(`/users/${uuid}`, { username: target.username, superuser: false });

    assert.ok(ok(status), `снятие владельца отвергнуто: ${status} ${JSON.stringify(body)}`);
    assert.ok(!body?.superuser, 'владелец не снят');
  });

  it('без права «Назначать владельца» владельца не выдать', async () => {
    const { session } = await createAdmin(['panel.users.read', 'panel.users.update']);
    const target = await createUser();
    const uuid = await targetUuid(session, target.username);

    const { status } = await session.patch(`/users/${uuid}`, { username: target.username, superuser: true });

    assert.equal(status, 403);
  });

  it('правка пользователя не сбрасывает владельца, если поле не прислали', async () => {
    const { session } = await createAdmin([
      'panel.users.read',
      'panel.users.update',
      'panel.users.field.superuser',
      'panel.users.field.roles',
    ]);
    const target = await createUser({ superuser: true });
    const uuid = await targetUuid(session, target.username);

    const { status, body } = await session.patch(`/users/${uuid}`, { username: target.username });

    assert.ok(ok(status), `правка отвергнута: ${status} ${JSON.stringify(body)}`);
    assert.equal(body?.superuser, true, 'владелец слетел при обычной правке');
  });

  it('слабый админ не может править более сильного', async () => {
    const weak = await createAdmin(['panel.users.read', 'panel.users.update']);
    const strong = await createUser({ perms: ['panel.access', 'panel.config.read', 'panel.config.update'] });
    const uuid = await targetUuid(weak.session, strong.username);

    const { status } = await weak.session.patch(`/users/${uuid}`, { username: strong.username });

    assert.equal(status, 403);
  });

  it('админ может править обычного игрока', async () => {
    const admin = await createAdmin(['panel.users.read', 'panel.users.update']);
    const target = await createUser();
    const uuid = await targetUuid(admin.session, target.username);

    const { status, body } = await admin.session.patch(`/users/${uuid}`, { username: target.username });

    assert.ok(ok(status), `правка обычного игрока отвергнута: ${status} ${JSON.stringify(body)}`);
  });

  it('смена скина требует отдельного права', async () => {
    const denied = await createAdmin(['panel.users.read', 'panel.users.update']);
    const target = await createUser();
    const uuid = await targetUuid(denied.session, target.username);

    const { status } = await denied.session.del(`/cabinet/skin/skin/${uuid}`);

    assert.equal(status, 403);
  });

  it('с правом на скин удаление скина проходит', async () => {
    const allowed = await createAdmin(['panel.users.read', 'panel.users.skin']);
    const target = await createUser();
    const uuid = await targetUuid(allowed.session, target.username);

    const { status } = await allowed.session.del(`/cabinet/skin/skin/${uuid}`);

    assert.ok(ok(status), `удаление скина отвергнуто: ${status}`);
  });

  it('право на скин не открывает плащ', async () => {
    const allowed = await createAdmin(['panel.users.read', 'panel.users.skin']);
    const target = await createUser();
    const uuid = await targetUuid(allowed.session, target.username);

    const { status } = await allowed.session.del(`/cabinet/skin/cloak/${uuid}`);

    assert.equal(status, 403);
  });
});

async function targetUuid(session, username) {
  const { body } = await session.get(`/users?search=${username}&limit=1`);

  return body?.data?.[0]?.uuid;
}
