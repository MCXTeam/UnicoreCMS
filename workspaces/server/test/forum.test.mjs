import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { closeDatabase, query } from './helpers/db.mjs';
import { anonymous, cleanup, createRole, createUser, rootSession } from './helpers/stand.mjs';

const ok = (status) => status >= 200 && status < 300;

const unique = () => `e2e${Math.random().toString(36).slice(2, 8)}`;

let admin = null;
let guest = null;
let writer = null;
let writerUuid = null;
let reader = null;
let readerUuid = null;
let moderator = null;

const nodes = { root: null, open: null, closed: null, hidden: null, guarded: null, spare: null };

let topicId = null;
let firstPostId = null;

async function makeNode(body) {
  const { status, body: created } = await admin.post('/mod/forum/admin/nodes', body);

  assert.ok(ok(status), `раздел не создан: ${status} ${JSON.stringify(created)}`);

  return created.id;
}

async function uuidOf(username) {
  return (await query('SELECT uuid FROM unicore_users WHERE username = ?', [username]))[0]?.uuid ?? null;
}

before(async () => {
  admin = await rootSession();
  guest = await anonymous();

  const deniedRole = await createRole(['!mod.forum.write']);
  const moderatorRole = await createRole([]);

  const writerUser = await createUser();
  const readerUser = await createUser({ roles: [deniedRole] });
  const moderatorUser = await createUser({ roles: [moderatorRole] });

  writer = writerUser.session;
  writerUuid = await uuidOf(writerUser.username);
  reader = readerUser.session;
  readerUuid = await uuidOf(readerUser.username);
  moderator = moderatorUser.session;

  nodes.root = await makeNode({ slug: `${unique()}-root`, title: 'Корневой раздел', position: 1 });
  nodes.open = await makeNode({ slug: `${unique()}-open`, title: 'Открытый раздел', parent_id: nodes.root, position: 2 });
  nodes.closed = await makeNode({ slug: `${unique()}-closed`, title: 'Закрытый раздел', parent_id: nodes.root, locked: true });
  nodes.hidden = await makeNode({ slug: `${unique()}-hidden`, title: 'Скрытый раздел', parent_id: nodes.root, hidden: true });
  nodes.spare = await makeNode({ slug: `${unique()}-spare`, title: 'Раздел для проверок прав', position: 9 });
  nodes.guarded = await makeNode({
    slug: `${unique()}-guarded`,
    title: 'Раздел по праву',
    parent_id: nodes.root,
    read_permission: 'mod.forum.moderate',
    moderator_roles: [moderatorRole],
  });
});

after(async () => {
  const ids = Object.values(nodes).filter(Boolean);

  if (ids.length) {
    const list = ids.join(', ');

    await query(`DELETE FROM mod_forum_reactions WHERE post_id IN (SELECT id FROM mod_forum_posts WHERE topic_id IN (SELECT id FROM mod_forum_topics WHERE node_id IN (${list})))`).catch(() => null);
    await query(`DELETE FROM mod_forum_reads WHERE topic_id IN (SELECT id FROM mod_forum_topics WHERE node_id IN (${list}))`).catch(() => null);
    await query(`DELETE FROM mod_forum_posts WHERE topic_id IN (SELECT id FROM mod_forum_topics WHERE node_id IN (${list}))`).catch(() => null);
    await query(`DELETE FROM mod_forum_topics WHERE node_id IN (${list})`).catch(() => null);
    await query(`DELETE FROM mod_forum_nodes WHERE id IN (${list})`).catch(() => null);
  }

  if (writerUuid) await query('DELETE FROM unicore_notifications WHERE user_uuid = ?', [writerUuid]).catch(() => null);
  if (readerUuid) await query('DELETE FROM unicore_notifications WHERE user_uuid = ?', [readerUuid]).catch(() => null);

  await cleanup();
  await closeDatabase();
});

describe('Форум', () => {
  it('гость видит разделы и не видит скрытые и закрытые правом', async () => {
    const { status, body } = await guest.get('/mod/forum');

    assert.ok(ok(status), `форум недоступен гостю: ${status}`);

    const section = body.sections.find((item) => item.id === nodes.root);

    assert.ok(section, 'корневой раздел не виден');

    const slugs = section.children.map((child) => child.id);

    assert.ok(slugs.includes(nodes.open));
    assert.ok(!slugs.includes(nodes.hidden), 'скрытый раздел виден гостю');
    assert.ok(!slugs.includes(nodes.guarded), 'раздел под правом виден гостю');
  });

  it('гость не может создать тему', async () => {
    const slug = await slugOf(nodes.open);
    const { status } = await guest.post(`/mod/forum/nodes/${slug}/topics`, { title: 'Гостевая тема', content: '<p>текст</p>' });

    assert.equal(status, 401);
  });

  it('писать может любой игрок, запрет у роли забирает право', async () => {
    const slug = await slugOf(nodes.open);

    const denied = await reader.post(`/mod/forum/nodes/${slug}/topics`, { title: 'Без права', content: '<p>текст</p>' });

    assert.equal(denied.status, 403);

    const allowed = await writer.post(`/mod/forum/nodes/${slug}/topics`, {
      title: 'Первая тема раздела',
      content: '<p>Вопрос по <b>серверу</b>.</p>',
    });

    assert.ok(ok(allowed.status), `тема не создана: ${allowed.status} ${JSON.stringify(allowed.body)}`);

    topicId = allowed.body.id;
  });

  it('роль выше приоритетом возвращает право, отнятое ролью ниже', async () => {
    const low = await createRole(['!mod.forum.write'], { priority: 1 });
    const high = await createRole(['mod.forum.write'], { priority: 9 });
    const both = await createUser({ roles: [low, high] });
    const slug = await slugOf(nodes.spare);

    const profile = await both.session.get('/auth/me');

    assert.ok(profile.body.user.perms.includes('mod.forum.write'), 'старшая роль не вернула право');

    const { status } = await both.session.post(`/mod/forum/nodes/${slug}/topics`, {
      title: 'Тема от старшей роли',
      content: '<p>текст</p>',
    });

    assert.ok(ok(status), `игрок со старшей ролью не смог создать тему: ${status}`);
  });

  it('запрет на чтение закрывает форум целиком', async () => {
    const blind = await createRole(['!mod.forum.read'], { priority: 1 });
    const user = await createUser({ roles: [blind] });
    const slug = await slugOf(nodes.spare);

    const index = await user.session.get('/mod/forum');
    const node = await user.session.get(`/mod/forum/nodes/${slug}`);

    assert.equal(node.status, 403, 'раздел открылся без права на чтение');
    assert.ok(ok(index.status), `главная форума недоступна: ${index.status}`);
    assert.equal(index.body.sections.length, 0, 'разделы видны без права на чтение');
  });

  it('запрет у роли убирает право и из списка прав игрока', async () => {
    const denied = await reader.get('/auth/me');
    const granted = await writer.get('/auth/me');

    assert.ok(ok(denied.status) && ok(granted.status), 'профиль игрока недоступен');

    assert.ok(granted.body.user.perms.includes('mod.forum.write'), 'право по умолчанию не досталось игроку');
    assert.ok(!denied.body.user.perms.includes('mod.forum.write'), 'запрет роли не убрал право из профиля');
    assert.ok(denied.body.user.perms.includes('mod.forum.read'), 'запрет одного права забрал соседнее');
  });

  it('счётчики раздела и родителя выросли', async () => {
    const list = await admin.get('/mod/forum/admin/nodes');
    const open = list.body.find((item) => item.id === nodes.open);
    const root = list.body.find((item) => item.id === nodes.root);

    assert.equal(open.topics_count, 1);
    assert.equal(open.posts_count, 1);
    assert.equal(root.topics_count, 1);
    assert.equal(root.posts_count, 1);
  });

  it('в закрытом разделе тему не завести', async () => {
    const slug = await slugOf(nodes.closed);
    const { status } = await writer.post(`/mod/forum/nodes/${slug}/topics`, { title: 'В закрытый', content: '<p>текст</p>' });

    assert.equal(status, 403);
  });

  it('опасная разметка вырезается', async () => {
    const slug = await slugOf(nodes.open);
    const { status, body } = await writer.post(`/mod/forum/nodes/${slug}/topics`, {
      title: 'Тема с разметкой',
      content: '<p class="lead" id="x" style="color:red">текст<script>alert(1)</script></p>',
    });

    assert.ok(ok(status), `тема не создана: ${status}`);

    const opened = await guest.get(`/mod/forum/topics/${body.id}`);
    const content = opened.body.posts.data[0].content;

    assert.ok(content.includes('class="lead"'), 'класс должен оставаться');
    assert.ok(!content.includes('<script'), 'скрипт должен быть вырезан');
    assert.ok(!content.includes('style='), 'style должен быть вырезан');
    assert.ok(!content.includes('id='), 'id должен быть вырезан');
  });

  it('ответ доходит до автора темы уведомлением', async () => {
    const before = await writer.get('/cabinet/notifications');

    const denied = await reader.post(`/mod/forum/topics/${topicId}/posts`, { content: '<p>Поддерживаю вопрос.</p>' });

    assert.equal(denied.status, 403, 'роль с запретом не отвечает');

    const allowed = await moderator.post(`/mod/forum/topics/${topicId}/posts`, { content: '<p>Сейчас посмотрим.</p>' });

    assert.ok(ok(allowed.status), `ответ не отправлен: ${allowed.status} ${JSON.stringify(allowed.body)}`);

    const feed = await waitFor(writer, (payload) => payload.total > before.body.total);
    const top = feed.items[0];

    assert.equal(top.type, 'forum.reply');
    assert.equal(top.category, 'forum');
    assert.equal(top.link, `/mod/forum/topic/${topicId}`);
    assert.equal(top.params.topic, 'Первая тема раздела');
  });

  it('реакция ставится и снимается', async () => {
    const opened = await writer.get(`/mod/forum/topics/${topicId}`);

    firstPostId = opened.body.posts.data[0].id;

    const on = await writer.post(`/mod/forum/posts/${firstPostId}/reactions`, { kind: 'like' });

    assert.ok(ok(on.status), `реакция не поставилась: ${on.status}`);
    assert.deepEqual(on.body, [{ kind: 'like', count: 1, mine: true }]);

    const off = await writer.post(`/mod/forum/posts/${firstPostId}/reactions`, { kind: 'like' });

    assert.deepEqual(off.body, []);

    const unknown = await writer.post(`/mod/forum/posts/${firstPostId}/reactions`, { kind: 'rocket' });

    assert.equal(unknown.status, 400);
  });

  it('своё сообщение правится, чужое — нет', async () => {
    const opened = await writer.get(`/mod/forum/topics/${topicId}`);
    const own = opened.body.posts.data.find((post) => post.can.edit);
    const foreign = opened.body.posts.data.find((post) => !post.can.edit);

    assert.ok(own, 'нет своего сообщения');
    assert.ok(foreign, 'нет чужого сообщения');

    const edited = await writer.patch(`/mod/forum/posts/${own.id}`, { content: '<p>Вопрос по серверу, дополнил.</p>' });

    assert.ok(ok(edited.status), `правка не прошла: ${edited.status}`);

    const after_ = await writer.get(`/mod/forum/topics/${topicId}`);
    const updated = after_.body.posts.data.find((post) => post.id === own.id);

    assert.ok(updated.edited_at, 'нет пометки об изменении');

    const denied = await writer.patch(`/mod/forum/posts/${foreign.id}`, { content: '<p>подмена</p>' });

    assert.equal(denied.status, 403);
  });

  it('модератор правит чужое сообщение только с отдельным правом', async () => {
    const reply = await writer.post(`/mod/forum/topics/${topicId}/posts`, { content: '<p>Сообщение автора темы.</p>' });

    assert.ok(ok(reply.status), `ответ не создан: ${reply.status}`);

    const plainRole = await createRole(['mod.forum.moderate']);
    const plain = await createUser({ roles: [plainRole] });
    const opened = await plain.session.get(`/mod/forum/topics/${topicId}`);
    const foreign = opened.body.posts.data.find((post) => post.id === reply.body.id);

    assert.ok(foreign, 'сообщение для проверки не найдено');
    assert.equal(foreign.can.edit, false, 'модератор видит правку чужого сообщения без права');
    assert.equal(foreign.can.delete, true, 'модератор не может удалить чужое сообщение');

    const denied = await plain.session.patch(`/mod/forum/posts/${foreign.id}`, { content: '<p>подмена модератором</p>' });

    assert.equal(denied.status, 403, 'чужое сообщение переписали без права');

    const editorRole = await createRole(['mod.forum.moderate', 'mod.forum.edit_posts']);
    const editor = await createUser({ roles: [editorRole] });
    const allowed = await editor.session.patch(`/mod/forum/posts/${foreign.id}`, { content: '<p>правка с правом</p>' });

    assert.ok(ok(allowed.status), `правка с правом не прошла: ${allowed.status}`);

    const logged = await query(
      'SELECT action, class, target_id FROM unicore_audit_logs WHERE action = ? ORDER BY id DESC LIMIT 1',
      ['mod.forum.post.edit'],
    );

    assert.equal(logged[0]?.class, 'mod.forum', 'правка чужого сообщения не попала в раздел журнала «Форум»');
    assert.equal(Number(logged[0]?.target_id), foreign.id);
  });

  it('автор открывает только ту тему, которую закрыл сам', async () => {
    const slug = await slugOf(nodes.spare);
    const created = await writer.post(`/mod/forum/nodes/${slug}/topics`, { title: 'Тема автора', content: '<p>текст</p>' });

    assert.ok(ok(created.status), `тема не создана: ${created.status}`);

    const own = created.body.id;

    assert.ok(ok((await writer.patch(`/mod/forum/topics/${own}`, { closed: true })).status), 'автор не смог закрыть свою тему');
    assert.ok(ok((await writer.patch(`/mod/forum/topics/${own}`, { closed: false })).status), 'автор не смог открыть свою тему');

    const byAdmin = await admin.patch(`/mod/forum/topics/${own}`, { closed: true });

    assert.ok(ok(byAdmin.status), `модератор не смог закрыть тему: ${byAdmin.status}`);

    const denied = await writer.patch(`/mod/forum/topics/${own}`, { closed: false });

    assert.equal(denied.status, 403, 'автор открыл тему, закрытую модератором');

    const view = await writer.get(`/mod/forum/topics/${own}`);

    assert.equal(view.body.can.open, false);
    assert.ok(ok((await admin.patch(`/mod/forum/topics/${own}`, { closed: false })).status));
  });

  it('настройка запрещает игроку закрывать свои темы', async () => {
    const slug = await slugOf(nodes.spare);
    const created = await writer.post(`/mod/forum/nodes/${slug}/topics`, { title: 'Тема без закрытия', content: '<p>текст</p>' });
    const own = created.body.id;

    const off = await admin.patch('/config', { key: 'mod_forum_player_close', value: 'false', type: 2 });

    assert.ok(ok(off.status), `настройка не сохранилась: ${off.status} ${JSON.stringify(off.body)}`);

    try {
      const denied = await writer.patch(`/mod/forum/topics/${own}`, { closed: true });

      assert.equal(denied.status, 403, 'игрок закрыл тему при выключенной настройке');

      const view = await writer.get(`/mod/forum/topics/${own}`);

      assert.equal(view.body.can.close, false);
    } finally {
      await admin.patch('/config', { key: 'mod_forum_player_close', value: 'true', type: 2 });
    }
  });

  it('первое сообщение темы не удаляется отдельно', async () => {
    const { status } = await writer.del(`/mod/forum/posts/${firstPostId}`);

    assert.equal(status, 400);
  });

  it('модератор раздела закрепляет и закрывает тему, обычный игрок — нет', async () => {
    const denied = await reader.patch(`/mod/forum/topics/${topicId}`, { pinned: true });

    assert.equal(denied.status, 403);

    const pinned = await admin.patch(`/mod/forum/topics/${topicId}`, { pinned: true, closed: true });

    assert.ok(ok(pinned.status), `тема не изменена: ${pinned.status}`);

    const opened = await guest.get(`/mod/forum/topics/${topicId}`);

    assert.equal(opened.body.topic.pinned, true);
    assert.equal(opened.body.topic.closed, true);

    const late = await writer.post(`/mod/forum/topics/${topicId}/posts`, { content: '<p>ещё вопрос</p>' });

    assert.equal(late.status, 403, 'в закрытую тему писать нельзя');

    await admin.patch(`/mod/forum/topics/${topicId}`, { closed: false });
  });

  it('автор закрывает свою тему сам', async () => {
    const { status } = await writer.patch(`/mod/forum/topics/${topicId}`, { closed: true });

    assert.ok(ok(status), `автор не смог закрыть тему: ${status}`);

    await admin.patch(`/mod/forum/topics/${topicId}`, { closed: false });
  });

  it('раздел под правом виден только тому, у кого право', async () => {
    const slug = await slugOf(nodes.guarded);

    const denied = await writer.get(`/mod/forum/nodes/${slug}`);

    assert.equal(denied.status, 403);

    const allowed = await admin.get(`/mod/forum/nodes/${slug}`);

    assert.ok(ok(allowed.status), `раздел недоступен администратору: ${allowed.status}`);
  });

  it('роль-модератор раздела модерирует его', async () => {
    const slug = await slugOf(nodes.guarded);
    const { status, body } = await moderator.get(`/mod/forum/nodes/${slug}`);

    assert.ok(ok(status), `раздел недоступен модератору раздела: ${status}`);
    assert.equal(body.can.moderate, true);
  });

  it('поиск находит тему и сообщение', async () => {
    const { status, body } = await guest.get('/mod/forum/search?q=Вопрос');

    assert.ok(ok(status), `поиск не работает: ${status}`);
    assert.ok(body.topics.length || body.posts.length, 'поиск ничего не нашёл');

    const short = await guest.get('/mod/forum/search?q=во');

    assert.deepEqual(short.body, { topics: [], posts: [] });
  });

  it('новая тема помечается непрочитанной, «всё прочитано» снимает метку', async () => {
    const slug = await slugOf(nodes.open);

    await admin.post('/mod/forum/read-all');

    const fresh = await admin.get(`/mod/forum/nodes/${slug}`);

    assert.ok(
      fresh.body.topics.data.every((topic) => !topic.unread),
      'после «всё прочитано» остались непрочитанные',
    );

    await writer.post(`/mod/forum/topics/${topicId}/posts`, { content: '<p>новое сообщение</p>' });

    const again = await admin.get(`/mod/forum/nodes/${slug}`);
    const target = again.body.topics.data.find((topic) => topic.id === topicId);

    assert.equal(target.unread, true, 'новое сообщение не пометило тему непрочитанной');
  });

  it('раздел с темами не удаляется, свободный — удаляется', async () => {
    const busy = await admin.del(`/mod/forum/admin/nodes/${nodes.open}`);

    assert.equal(busy.status, 400);

    const spare = await makeNode({ slug: `${unique()}-spare`, title: 'Временный раздел' });
    const removed = await admin.del(`/mod/forum/admin/nodes/${spare}`);

    assert.ok(ok(removed.status), `свободный раздел не удалён: ${removed.status}`);
  });

  it('адрес раздела уникален', async () => {
    const slug = await slugOf(nodes.open);
    const { status } = await admin.post('/mod/forum/admin/nodes', { slug, title: 'Дубль' });

    assert.equal(status, 400);
  });

  it('раздел нельзя вложить в собственный подраздел', async () => {
    const { status } = await admin.patch(`/mod/forum/admin/nodes/${nodes.root}`, {
      slug: await slugOf(nodes.root),
      title: 'Корневой раздел',
      parent_id: nodes.open,
    });

    assert.equal(status, 400);
  });

  it('разделами управляет только тот, у кого право', async () => {
    const { status } = await writer.post('/mod/forum/admin/nodes', { slug: `${unique()}-x`, title: 'Чужой раздел' });

    assert.equal(status, 403);
  });
});

async function slugOf(id) {
  return (await query('SELECT slug FROM mod_forum_nodes WHERE id = ?', [id]))[0]?.slug ?? '';
}

async function waitFor(session, predicate, attempts = 25) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const { body } = await session.get('/cabinet/notifications');

    if (predicate(body)) return body;

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error('уведомление не пришло');
}
