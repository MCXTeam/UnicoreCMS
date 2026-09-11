import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createAdmin, createUser, rootSession } from './helpers/stand.mjs';

const SERVER = 'hitech';

const NODE = {
  nick: 'unicore.style.nick_color',
  prefix: 'unicore.style.prefix',
  gradient: 'unicore.style.gradient',
};

const createdPermissions = [];

const createdProfiles = [];

after(async () => {
  await query("UPDATE unicore_configs SET value = 'false' WHERE `key` = 'mod_style_moderation'").catch(() => null);
  await query('DELETE FROM mod_style_values').catch(() => null);
  await query('DELETE FROM mod_style_requests').catch(() => null);
  await query('DELETE FROM mod_style_group_grants').catch(() => null);
  await query('DELETE FROM mod_style_profiles').catch(() => null);

  for (const id of createdPermissions) {
    await query('DELETE FROM unicore_users_donate_permissions WHERE permission_id = ?', [id]).catch(() => null);
    await query('DELETE FROM unicore_donate_permissions WHERE id = ?', [id]).catch(() => null);
  }

  await query("DELETE FROM unicore_rcon_commands WHERE kind = 'module'").catch(() => null);
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

const CONFIG_BOOLEAN = 2;

async function moderation(admin, enabled) {
  const { status } = await admin.patch('/config', {
    key: 'mod_style_moderation',
    value: String(enabled),
    type: CONFIG_BOOLEAN,
  });

  assert.ok(ok(status), `настройка модерации не переключилась: ${status}`);
}

async function uuidOf(username) {
  const rows = await query('SELECT uuid FROM unicore_users WHERE username = ?', [username]);

  return rows[0]?.uuid ?? null;
}

const profileBody = (extra = {}) => ({
  name: `Тест ${Math.random().toString(36).slice(2, 8)}`,
  colorChar: '&',
  colorTemplate: '{c}{code}',
  gradientMode: 'cms',
  colors: [
    { hex: '#ff5555', code: 'c' },
    { hex: '#55ff55', code: 'a' },
  ],
  maxLength: 8,
  weight: 100,
  commands: {
    nick_color: 'nick {username} {value}',
    nick_color_reset: 'nick {username} off',
    prefix: 'setprefix {uuid} {weight} {value}',
    prefix_reset: 'delprefix {uuid} {weight}',
  },
  free: [],
  servers: [SERVER],
  ...extra,
});

async function makeProfile(admin, extra = {}) {
  const { status, body } = await admin.post('/mod/style/profiles', profileBody(extra));

  assert.ok(ok(status), `профиль не создан: ${status} ${JSON.stringify(body)}`);

  createdProfiles.push(body.id);

  return body;
}

async function dropProfiles() {
  await query('DELETE FROM mod_style_profiles').catch(() => null);
  createdProfiles.length = 0;
}

async function givePermission(uuid, nodes) {
  const inserted = await query(
    "INSERT INTO unicore_donate_permissions (name, type, price, perms) VALUES ('Тестовое право', 'game', 100, ?)",
    [nodes.join(',')],
  );

  createdPermissions.push(inserted.insertId);

  await query('INSERT INTO unicore_users_donate_permissions (user_uuid, permission_id, server_id) VALUES (?, ?, ?)', [
    uuid,
    inserted.insertId,
    SERVER,
  ]);

  return inserted.insertId;
}

async function queued(uuid) {
  const rows = await query(
    "SELECT command FROM unicore_rcon_commands WHERE kind = 'module' AND command LIKE ? ORDER BY id",
    [`%${uuid}%`],
  );

  return rows.map((row) => row.command);
}

describe('Оформление', () => {
  it('сервер закрепляется за одним профилем', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin);

    const { status } = await admin.post('/mod/style/profiles', profileBody());

    assert.equal(status, 400, 'сервер удалось закрепить за двумя профилями');
  });

  it('без донат-права возможностей нет, с правом появляются', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin);

    const { session, username } = await createUser({});
    const uuid = await uuidOf(username);

    const before = await session.get('/mod/style/me').then((res) => res.body);
    const blank = before.servers.find((item) => item.id === SERVER);

    assert.ok(blank, 'сервер с профилем не показан в кабинете');
    assert.deepEqual(blank.capabilities, [], 'возможности появились без покупки');

    await givePermission(uuid, [NODE.nick]);

    const after_ = await session.get('/mod/style/me').then((res) => res.body);

    assert.deepEqual(
      after_.servers.find((item) => item.id === SERVER).capabilities,
      ['nick_color'],
      'нода донат-права не открыла возможность',
    );
  });

  it('профиль раздаёт возможность бесплатно всем', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin, { free: ['nick_color'] });

    const { session } = await createUser({});
    const state = await session.get('/mod/style/me').then((res) => res.body);

    assert.deepEqual(
      state.servers.find((item) => item.id === SERVER).capabilities,
      ['nick_color'],
      'бесплатная возможность не выдана',
    );
  });

  it('привилегия даёт возможность по сопоставлению', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin);

    const groups = await query('SELECT id FROM unicore_donate_groups LIMIT 1');

    assert.ok(groups.length, 'на стенде нет ни одной привилегии — проверку нечем провести');

    const groupId = groups[0].id;
    const { session, username } = await createUser({});
    const uuid = await uuidOf(username);

    await query('INSERT INTO unicore_users_donate_groups (user_uuid, group_id, server_id) VALUES (?, ?, ?)', [
      uuid,
      groupId,
      SERVER,
    ]);

    const saved = await admin.post('/mod/style/grants', { groupId: Number(groupId), capabilities: ['prefix'] });

    assert.ok(ok(saved.status), `сопоставление не сохранено: ${saved.status}`);

    const state = await session.get('/mod/style/me').then((res) => res.body);

    assert.deepEqual(
      state.servers.find((item) => item.id === SERVER).capabilities,
      ['prefix'],
      'привилегия не открыла возможность',
    );

    await query('DELETE FROM unicore_users_donate_groups WHERE user_uuid = ?', [uuid]);
    await query('DELETE FROM mod_style_group_grants');
  });

  it('без возможностей сохранить нельзя', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin);

    const { session } = await createUser({});
    const { status } = await session.post(`/mod/style/me/${SERVER}`, { nickColor: '#ff5555' });

    assert.equal(status, 403, 'сохранение прошло без единой возможности');
  });

  it('цвет вне палитры, длинный текст и запрещённое слово не проходят', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin, { free: ['nick_color', 'prefix'] });

    const { session } = await createUser({});

    const foreign = await session.post(`/mod/style/me/${SERVER}`, { nickColor: '#123456' });

    assert.equal(foreign.status, 400, 'прошёл цвет, которого нет в палитре');

    const long = await session.post(`/mod/style/me/${SERVER}`, { prefixText: 'СЛИШКОМДЛИННЫЙ' });

    assert.equal(long.status, 400, 'прошёл текст длиннее лимита профиля');

    const banned = await session.post(`/mod/style/me/${SERVER}`, { prefixText: 'админ' });

    assert.equal(banned.status, 400, 'прошло запрещённое слово');
  });

  it('перенос строки в тексте не доезжает до очереди команд', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin, { free: ['prefix'], maxLength: 32 });

    const { session, username } = await createUser({});
    const uuid = await uuidOf(username);

    const { status } = await session.post(`/mod/style/me/${SERVER}`, { prefixText: 'VI\nop me' });

    assert.equal(status, 400, 'перенос строки прошёл валидацию модуля');

    const commands = await queued(uuid);

    assert.ok(
      commands.every((command) => !/[\r\n]/.test(command)),
      `в очередь попала многострочная команда: ${JSON.stringify(commands)}`,
    );
  });

  it('ядро вычищает перенос строки даже из шаблона команды', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin, {
      free: ['prefix'],
      commands: { prefix: 'setprefix {uuid} {weight} {value}\nop {username}' },
    });

    const { session, username } = await createUser({});
    const uuid = await uuidOf(username);

    await session.post(`/mod/style/me/${SERVER}`, { prefixText: 'VIP', prefixColor: '#ff5555' });

    const commands = await queued(uuid);

    assert.ok(commands.length, 'команда не поставилась в очередь');
    assert.ok(
      commands.every((command) => !/[\r\n]/.test(command)),
      `очередь приняла многострочную команду: ${JSON.stringify(commands)}`,
    );
  });

  it('оформление уходит командами в очередь ядра', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin, { free: ['nick_color', 'prefix'] });

    const { session, username } = await createUser({});
    const uuid = await uuidOf(username);

    const { status } = await session.post(`/mod/style/me/${SERVER}`, {
      nickColor: '#ff5555',
      prefixText: 'VIP',
      prefixColor: '#55ff55',
    });

    assert.ok(ok(status), `оформление не сохранилось: ${status}`);

    const commands = await queued(uuid);

    assert.ok(
      commands.some((command) => command.includes(`setprefix ${uuid} 100 &aVIP`)),
      `префикс не собрался: ${JSON.stringify(commands)}`,
    );
  });

  it('градиент красит каждую букву, пока за него заплачено', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin, { free: ['prefix'], colors: [] });

    const { session, username } = await createUser({});
    const uuid = await uuidOf(username);

    await givePermission(uuid, [NODE.gradient]);

    await session.post(`/mod/style/me/${SERVER}`, {
      prefixText: 'AB',
      prefixColor: '#ff0000',
      prefixColorTo: '#00ff00',
    });

    const withGradient = await queued(uuid);

    assert.ok(
      withGradient.some((command) => /setprefix .+ 100 &[0-9a-f]A&[0-9a-f]B/.test(command)),
      `градиент не собрался побуквенно: ${JSON.stringify(withGradient)}`,
    );

    await query('DELETE FROM unicore_users_donate_permissions WHERE user_uuid = ?', [uuid]);
    await query("DELETE FROM unicore_rcon_commands WHERE kind = 'module'");

    await session.post(`/mod/style/me/${SERVER}`, {
      prefixText: 'AB',
      prefixColor: '#ff0000',
      prefixColorTo: '#00ff00',
    });

    const withoutGradient = await queued(uuid);

    assert.ok(withoutGradient.length, 'после потери градиента команда не отправилась вовсе');
    assert.ok(
      withoutGradient.every((command) => !/&[0-9a-f]A&[0-9a-f]B/.test(command)),
      `градиент остался без права на него: ${JSON.stringify(withoutGradient)}`,
    );
    assert.ok(
      withoutGradient.some((command) => command.includes('setprefix') && command.endsWith('AB')),
      `текст не остался одноцветным: ${JSON.stringify(withoutGradient)}`,
    );
  });

  it('префикс без выбранного цвета всё равно уходит на сервер', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin, { free: ['prefix'] });

    const { session, username } = await createUser({});
    const uuid = await uuidOf(username);

    await session.post(`/mod/style/me/${SERVER}`, { prefixText: 'VIP' });

    const commands = await queued(uuid);

    assert.ok(
      commands.some((command) => command.includes(`setprefix ${uuid} 100 VIP`)),
      `префикс без цвета потерялся: ${JSON.stringify(commands)}`,
    );
  });

  it('снятие оформления шлёт команду сброса', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin, { free: ['prefix'] });

    const { session, username } = await createUser({});
    const uuid = await uuidOf(username);

    await session.post(`/mod/style/me/${SERVER}`, { prefixText: 'VIP', prefixColor: '#ff5555' });
    await query("DELETE FROM unicore_rcon_commands WHERE kind = 'module'");

    const { status } = await session.del(`/mod/style/me/${SERVER}`);

    assert.ok(ok(status), `сброс не прошёл: ${status}`);

    const commands = await queued(uuid);

    assert.ok(
      commands.some((command) => command.includes(`delprefix ${uuid} 100`)),
      `команда снятия не ушла: ${JSON.stringify(commands)}`,
    );

    const left = await query('SELECT id FROM mod_style_values WHERE user_uuid = ?', [uuid]);

    assert.equal(left.length, 0, 'оформление осталось в базе после сброса');
  });

  it('админ сбрасывает оформление игрока', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await makeProfile(admin, { free: ['prefix'] });

    const { session, username } = await createUser({});
    const uuid = await uuidOf(username);

    await session.post(`/mod/style/me/${SERVER}`, { prefixText: 'VIP', prefixColor: '#ff5555' });

    const listed = await admin.get(`/mod/style/users/${uuid}`).then((res) => res.body);

    assert.equal(listed.length, 1, 'админка не видит оформление игрока');

    const { status } = await admin.del(`/mod/style/users/${uuid}/${SERVER}`);

    assert.ok(ok(status), `админский сброс не прошёл: ${status}`);

    const left = await admin.get(`/mod/style/users/${uuid}`).then((res) => res.body);

    assert.equal(left.length, 0, 'оформление не сбросилось');
  });

  it('модерация уводит текст в заявку и применяет после одобрения', async () => {
    await dropProfiles();

    const admin = await rootSession();

    await moderation(admin, true);

    try {
      await makeProfile(admin, { free: ['prefix'] });

      const { session, username } = await createUser({});
      const uuid = await uuidOf(username);

      const saved = await session.post(`/mod/style/me/${SERVER}`, { prefixText: 'TEST', prefixColor: '#ff5555' });

      assert.equal(saved.body?.pending, true, 'текст не ушёл на проверку при включённой модерации');

      const values = await query('SELECT prefix_text FROM mod_style_values WHERE user_uuid = ?', [uuid]);

      assert.equal(values[0]?.prefix_text ?? null, null, 'текст применился до одобрения');

      const requests = await admin.get('/mod/style/requests?status=pending').then((res) => res.body);
      const request = requests.find((item) => item.userUuid === uuid);

      assert.ok(request, 'заявка не создана');

      const reviewed = await admin.patch(`/mod/style/requests/${request.id}`, { approved: true });

      assert.ok(ok(reviewed.status), `заявка не одобрена: ${reviewed.status}`);

      const after_ = await query('SELECT prefix_text FROM mod_style_values WHERE user_uuid = ?', [uuid]);

      assert.equal(after_[0]?.prefix_text, 'TEST', 'одобренный текст не применился');
    } finally {
      await moderation(admin, false);
    }
  });

  it('без права список профилей закрыт', async () => {
    const { session } = await createAdmin([]);

    const { status } = await session.get('/mod/style/profiles');

    assert.equal(status, 403, 'профили открыты без права');
  });
});
