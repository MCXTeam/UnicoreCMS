import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { session } from './helpers/api.mjs';
import { closeDatabase, query } from './helpers/db.mjs';
import { cleanup, createAdmin, rootSession } from './helpers/stand.mjs';

const HIDDEN_TITLE = 'e2e скрытая новость';

const PUBLIC_TITLE = 'e2e открытая новость';

after(async () => {
  await query('DELETE FROM unicore_news WHERE title LIKE ?', ['e2e %']).catch(() => null);
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

async function seedNews() {
  const admin = await rootSession();

  await admin.post('/news', { title: HIDDEN_TITLE, description: 'текст', hidden: true });
  await admin.post('/news', { title: PUBLIC_TITLE, description: 'текст', hidden: false });
}

const titles = (body) => (body?.data || []).map((item) => item.title);

describe('Скрытые новости', () => {
  it('гость не видит скрытую новость', async () => {
    await seedNews();

    const guest = session();
    const { status, body } = await guest.get('/news?limit=100');

    assert.ok(ok(status), `лента отвергнута: ${status}`);
    assert.ok(titles(body).includes(PUBLIC_TITLE), 'открытая новость пропала из ленты');
    assert.ok(!titles(body).includes(HIDDEN_TITLE), 'скрытая новость видна гостю');
  });

  it('редактор новостей не видит скрытую новость в ленте сайта', async () => {
    await seedNews();

    const { session: editor } = await createAdmin(['panel.news.read', 'panel.news.create', 'panel.news.update']);
    const { body } = await editor.get('/news?limit=100');

    assert.ok(!titles(body).includes(HIDDEN_TITLE), 'скрытая новость утекла в ленту сайта');
  });

  it('редактор новостей видит скрытую новость в панели', async () => {
    await seedNews();

    const { session: editor } = await createAdmin(['panel.news.read', 'panel.news.create', 'panel.news.update']);
    const { body } = await editor.get('/news?limit=100&scope=panel');

    assert.ok(titles(body).includes(HIDDEN_TITLE), 'скрытая новость не видна редактору в панели');
  });

  it('право «Видеть скрытые новости» показывает их в ленте сайта', async () => {
    await seedNews();

    const { session: reader } = await createAdmin(['panel.news.read', 'panel.news.hidden']);
    const { body } = await reader.get('/news?limit=100');

    assert.ok(titles(body).includes(HIDDEN_TITLE), 'право не показало скрытые новости');
  });

  it('обычный игрок с областью панели всё равно не видит скрытые', async () => {
    await seedNews();

    const { session: plain } = await createAdmin([]);
    const { body } = await plain.get('/news?limit=100&scope=panel');

    assert.ok(!titles(body).includes(HIDDEN_TITLE), 'область панели обошла проверку прав');
  });
});
