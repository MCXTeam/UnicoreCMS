import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createUser, rootSession } from './helpers/stand.mjs';

const ok = (status) => status >= 200 && status < 300;

const uniqueName = () => `e2e-${Math.random().toString(36).slice(2, 10)}`;

let admin = null;
let serverId = null;
let periodId = null;
let groupId = null;
let player = null;
let playerUuid = null;

async function waitForFeed(expected, attempts = 25) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const { status, body } = await player.get('/cabinet/notifications');

    assert.ok(ok(status), `лента уведомлений недоступна: ${status}`);

    if (body.total === expected && body.items.length === expected) return body;

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const { body } = await player.get('/cabinet/notifications');

  throw new Error(`лента не пришла к ${expected} уведомлениям: ${JSON.stringify(body)}`);
}

async function grant() {
  const { status, body } = await admin.post('/donates/groups/admin/give', {
    user_uuid: playerUuid,
    server_id: serverId,
    group_id: groupId,
    period_id: periodId,
  });

  assert.ok(ok(status), `группа не выдана: ${status} ${JSON.stringify(body)}`);
}

async function revoke() {
  const { status, body } = await admin.get(`/donates/groups/admin/${playerUuid}`);

  assert.ok(ok(status), `выдачи не прочитаны: ${status}`);

  const row = body.find((item) => item.group?.id === groupId);

  assert.ok(row, 'выданная группа не найдена');

  const removed = await admin.del(`/donates/groups/admin/${row.id}`);

  assert.ok(ok(removed.status), `группа не снята: ${removed.status} ${JSON.stringify(removed.body)}`);
}

before(async () => {
  admin = await rootSession();
  serverId = (await query('SELECT id FROM unicore_servers ORDER BY priority ASC LIMIT 1'))[0]?.id ?? null;
  periodId = (await query('SELECT id FROM unicore_periods ORDER BY id ASC LIMIT 1'))[0]?.id ?? null;

  assert.ok(serverId, 'на стенде нет ни одного сервера');
  assert.ok(periodId, 'на стенде нет ни одного периода');

  const name = uniqueName();
  const created = await admin.post('/donates/groups', {
    name,
    description: 'уведомления',
    price: 100,
    sale: 0,
    ingame_id: name,
    web_perms: [],
    features: [],
    virtual_percent: 0,
    servers: [serverId],
    periods: [periodId],
    kits: [],
  });

  assert.ok(ok(created.status), `группа доната не создана: ${created.status} ${JSON.stringify(created.body)}`);

  groupId = created.body.id;

  const user = await createUser();

  player = user.session;
  playerUuid = (await query('SELECT uuid FROM unicore_users WHERE username = ?', [user.username]))[0]?.uuid ?? null;

  assert.ok(playerUuid, 'uuid игрока не найден');
});

after(async () => {
  if (groupId) {
    await query('DELETE FROM unicore_users_donate_groups WHERE group_id = ?', [groupId]).catch(() => null);
    await query('DELETE FROM unicore_servers_donate_groups WHERE group_id = ?', [groupId]).catch(() => null);
    await query('DELETE FROM unicore_donate_groups_periods WHERE group_id = ?', [groupId]).catch(() => null);
    await query('DELETE FROM unicore_donate_groups WHERE id = ?', [groupId]).catch(() => null);
  }

  await cleanup();
  await closeDatabase();
});

describe('Уведомления', () => {
  it('у нового игрока лента пуста', async () => {
    const { status, body } = await player.get('/cabinet/notifications');

    assert.ok(ok(status), `лента недоступна: ${status}`);
    assert.equal(body.total, 0);
    assert.equal(body.unread, 0);
    assert.deepEqual(body.items, []);
  });

  it('выдача привилегии создаёт непрочитанное уведомление', async () => {
    await grant();

    const feed = await waitForFeed(1);
    const [item] = feed.items;

    assert.equal(feed.unread, 1);
    assert.equal(item.type, 'donate.granted');
    assert.equal(item.category, 'donate');
    assert.equal(item.titleKey, 'notifications.donate_granted');
    assert.equal(item.read, false);
    assert.equal(item.link, '/cabinet/donate');
    assert.ok(item.params.name, 'в уведомлении нет названия привилегии');
    assert.ok(item.params.server, 'в уведомлении нет названия сервера');
  });

  it('снятие привилегии создаёт отдельное уведомление', async () => {
    await revoke();

    const feed = await waitForFeed(2);

    assert.equal(feed.items[0].type, 'donate.revoked');
    assert.equal(feed.items[0].titleKey, 'notifications.donate_revoked');
    assert.equal(feed.unread, 2);
  });

  it('прочтение сбрасывает счётчик', async () => {
    const { status, body } = await player.post('/cabinet/notifications/read', {});

    assert.ok(ok(status), `пометка прочитанным не удалась: ${status}`);
    assert.equal(body.unread, 0);

    const feed = await player.get('/cabinet/notifications');

    assert.ok(feed.body.items.every((item) => item.read));
  });

  it('в настройках есть категории ядра и все включены', async () => {
    const { status, body } = await player.get('/cabinet/notifications/settings');

    assert.ok(ok(status), `настройки недоступны: ${status}`);

    const donate = body.find((category) => category.id === 'donate');
    const payment = body.find((category) => category.id === 'payment');

    assert.ok(donate, 'нет категории привилегий');
    assert.ok(payment, 'нет категории баланса');
    assert.equal(donate.enabled, true);
    assert.equal(payment.enabled, true);
  });

  it('выключенная категория не создаёт уведомлений', async () => {
    const off = await player.patch('/cabinet/notifications/settings', { category: 'donate', enabled: false });

    assert.ok(ok(off.status), `категория не выключена: ${off.status}`);
    assert.equal(off.body.find((category) => category.id === 'donate').enabled, false);

    await grant();
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { body } = await player.get('/cabinet/notifications');

    assert.equal(body.total, 2);
    assert.equal(body.unread, 0);
  });

  it('включённая обратно категория снова присылает уведомления', async () => {
    const on = await player.patch('/cabinet/notifications/settings', { category: 'donate', enabled: true });

    assert.ok(ok(on.status), `категория не включена: ${on.status}`);
    assert.equal(on.body.find((category) => category.id === 'donate').enabled, true);

    await revoke();

    const feed = await waitForFeed(3);

    assert.equal(feed.unread, 1);
  });

  it('чужие уведомления не видны', async () => {
    const other = await createUser();
    const { status, body } = await other.session.get('/cabinet/notifications');

    assert.ok(ok(status), `лента недоступна: ${status}`);
    assert.equal(body.total, 0);
  });

  it('неизвестная категория настроек отбивается', async () => {
    const { status } = await player.patch('/cabinet/notifications/settings', { category: 'no-such-category', enabled: false });

    assert.equal(status, 400);

    const rows = await query('SELECT COUNT(*) AS total FROM unicore_notification_mutes WHERE category = ?', ['no-such-category']);

    assert.equal(Number(rows[0].total), 0, 'отключение несуществующей категории записалось в базу');
  });

  it('курсор before отдаёт страницу без сдвига', async () => {
    const head = await player.get('/cabinet/notifications?limit=1');

    assert.ok(ok(head.status), `лента недоступна: ${head.status}`);
    assert.equal(head.body.items.length, 1);

    const cursor = head.body.items[0].id;
    const next = await player.get(`/cabinet/notifications?limit=1&before=${cursor}`);

    assert.ok(ok(next.status), `страница по курсору недоступна: ${next.status}`);
    assert.equal(next.body.items.length, 1);
    assert.ok(next.body.items[0].id < cursor, 'курсор вернул то же или более новое уведомление');
    assert.equal(next.body.total, head.body.total, 'общее число уведомлений поехало от курсора');
  });

  it('уведомление удаляется поштучно и лента очищается целиком', async () => {
    const before = await player.get('/cabinet/notifications');
    const target = before.body.items[0].id;

    const removed = await player.del(`/cabinet/notifications/${target}`);

    assert.ok(ok(removed.status), `уведомление не удалено: ${removed.status}`);

    const afterRemove = await player.get('/cabinet/notifications');

    assert.equal(afterRemove.body.total, 2);
    assert.ok(!afterRemove.body.items.some((item) => item.id === target));

    const cleared = await player.del('/cabinet/notifications');

    assert.ok(ok(cleared.status), `лента не очищена: ${cleared.status}`);
    assert.equal(cleared.body.unread, 0);

    const empty = await player.get('/cabinet/notifications');

    assert.equal(empty.body.total, 0);
  });

  it('гостю лента недоступна', async () => {
    const { status } = await player.get('/cabinet/notifications', { auth: false, csrf: false });

    assert.equal(status, 401);
  });
});
