import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createAdmin, createUser, rootSession } from './helpers/stand.mjs';

after(async () => {
  await setFlags(false, false).catch(() => null);
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

const BIND = 'public_referal_bind_enabled';
const REBIND = 'public_referal_rebind_enabled';

async function uuidOf(username) {
  const rows = await query('SELECT uuid FROM unicore_users WHERE username = ?', [username]);

  return rows[0]?.uuid ?? null;
}

async function inviterOf(username) {
  const rows = await query(
    'SELECT inviter.username AS inviter FROM unicore_referals ref ' +
      'JOIN unicore_users u ON u.uuid = ref.user_uuid ' +
      'JOIN unicore_users inviter ON inviter.uuid = ref.inviter_uuid WHERE u.username = ?',
    [username],
  );

  return rows[0]?.inviter ?? null;
}

async function setFlags(bind, rebind) {
  const admin = await rootSession();

  await admin.patch('/config', { key: BIND, value: String(bind), type: 2 });
  await admin.patch('/config', { key: REBIND, value: String(rebind), type: 2 });
}

describe('Пригласивший в кабинете', () => {
  it('блок выключен, пока настройка не включена', async () => {
    await setFlags(false, false);

    const player = await createUser({});
    const rules = await player.session.get('/cabinet/referals/me/inviter/rules');

    assert.equal(rules.body?.enabled, false, 'блок открыт при выключенной настройке');

    const bind = await player.session.put('/cabinet/referals/me/inviter', { code: 'whoever' });

    assert.equal(bind.status, 403);
  });

  it('игрок указывает пригласившего по логину', async () => {
    await setFlags(true, false);

    const inviter = await createUser({});
    const player = await createUser({});

    const { status } = await player.session.put('/cabinet/referals/me/inviter', { code: inviter.username });

    assert.ok(ok(status), `привязка не прошла: ${status}`);
    assert.equal(await inviterOf(player.username), inviter.username, 'связка не записалась');
  });

  it('без разрешения на смену второй раз указать нельзя', async () => {
    await setFlags(true, false);

    const first = await createUser({});
    const second = await createUser({});
    const player = await createUser({});

    await player.session.put('/cabinet/referals/me/inviter', { code: first.username });

    const rules = await player.session.get('/cabinet/referals/me/inviter/rules');

    assert.equal(rules.body?.bound, true, 'связка не отмечена');
    assert.equal(rules.body?.editable, false, 'поле осталось доступным');

    const again = await player.session.put('/cabinet/referals/me/inviter', { code: second.username });

    assert.equal(again.status, 403);
    assert.equal(await inviterOf(player.username), first.username, 'пригласивший подменился');
  });

  it('с разрешением на смену пригласившего можно переписать', async () => {
    await setFlags(true, true);

    const first = await createUser({});
    const second = await createUser({});
    const player = await createUser({});

    await player.session.put('/cabinet/referals/me/inviter', { code: first.username });

    const { status } = await player.session.put('/cabinet/referals/me/inviter', { code: second.username });

    assert.ok(ok(status), `смена не прошла: ${status}`);
    assert.equal(await inviterOf(player.username), second.username, 'пригласивший не сменился');
  });

  it('себя и своего же реферала указать нельзя', async () => {
    await setFlags(true, true);

    const inviter = await createUser({});
    const player = await createUser({});

    const self = await player.session.put('/cabinet/referals/me/inviter', { code: player.username });

    assert.equal(self.status, 400, 'дали указать самого себя');

    await inviter.session.put('/cabinet/referals/me/inviter', { code: player.username });

    const cycle = await player.session.put('/cabinet/referals/me/inviter', { code: inviter.username });

    assert.equal(cycle.status, 400, 'дали замкнуть связку в кольцо');
    assert.equal(await inviterOf(player.username), null, 'кольцо всё-таки записалось');
  });

  it('несуществующий код отвергается', async () => {
    await setFlags(true, true);

    const player = await createUser({});
    const { status } = await player.session.put('/cabinet/referals/me/inviter', { code: 'e2e-no-such-player' });

    assert.equal(status, 404);
  });
});

describe('Рефералы в панели', () => {
  it('без права раздел закрыт', async () => {
    const admin = await createAdmin([]);

    const list = await admin.session.get('/admin/referals');

    assert.equal(list.status, 403);
  });

  it('связка создаётся, меняется и удаляется', async () => {
    const admin = await createAdmin([
      'panel.referals.read',
      'panel.referals.create',
      'panel.referals.update',
      'panel.referals.delete',
    ]);
    const first = await createUser({});
    const second = await createUser({});
    const player = await createUser({});
    const playerUuid = await uuidOf(player.username);

    const created = await admin.session.post('/admin/referals', {
      user_uuid: playerUuid,
      inviter_uuid: await uuidOf(first.username),
    });

    assert.ok(ok(created.status), `связка не создана: ${created.status}`);
    assert.equal(await inviterOf(player.username), first.username);

    const duplicate = await admin.session.post('/admin/referals', {
      user_uuid: playerUuid,
      inviter_uuid: await uuidOf(second.username),
    });

    assert.equal(duplicate.status, 409, 'вторую связку тому же игроку создали');

    const updated = await admin.session.patch(`/admin/referals/${playerUuid}`, { inviter_uuid: await uuidOf(second.username) });

    assert.ok(ok(updated.status), `связка не изменена: ${updated.status}`);
    assert.equal(await inviterOf(player.username), second.username);

    const listed = await admin.session.get(`/admin/referals?search=${player.username}`);

    assert.equal(listed.body?.data?.[0]?.user?.username, player.username, 'связки нет в списке');
    assert.equal(listed.body?.data?.[0]?.inviter?.username, second.username, 'в списке старый пригласивший');

    const removed = await admin.session.del(`/admin/referals/${playerUuid}`);

    assert.ok(ok(removed.status), `связка не удалена: ${removed.status}`);
    assert.equal(await inviterOf(player.username), null, 'связка осталась');
  });

  it('кольцо через панель не создать', async () => {
    const admin = await createAdmin(['panel.referals.read', 'panel.referals.create']);
    const inviter = await createUser({});
    const player = await createUser({});

    await admin.session.post('/admin/referals', {
      user_uuid: await uuidOf(inviter.username),
      inviter_uuid: await uuidOf(player.username),
    });

    const cycle = await admin.session.post('/admin/referals', {
      user_uuid: await uuidOf(player.username),
      inviter_uuid: await uuidOf(inviter.username),
    });

    assert.equal(cycle.status, 400);
  });

  it('поиск игроков отдаёт только совпадения', async () => {
    const admin = await createAdmin(['panel.referals.read']);
    const player = await createUser({});

    const found = await admin.session.get(`/admin/referals/lookup?search=${player.username}`);

    assert.ok(ok(found.status), `поиск не отработал: ${found.status}`);
    assert.equal(found.body?.[0]?.username, player.username);

    const empty = await admin.session.get('/admin/referals/lookup?search=');

    assert.deepEqual(empty.body, [], 'пустой запрос вернул игроков');
  });
});
