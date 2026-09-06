import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { anonymous, cleanup, createAdmin, rootSession } from './helpers/stand.mjs';
import { closeDatabase, query } from './helpers/db.mjs';

after(async () => {
  await query("DELETE FROM unicore_layouts WHERE id = 'footer'").catch(() => null);
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

const row = (blocks) => ({ id: 'main', align: 'between', blocks });

describe('Шапка и подвал', () => {
  it('раскладка отдаётся всем без входа', async () => {
    const guest = await anonymous();

    const { status, body } = await guest.get('/layouts');

    assert.ok(ok(status), `раскладка не отдана: ${status}`);
    assert.ok(Array.isArray(body?.header?.rows), 'нет рядов шапки');
    assert.ok(Array.isArray(body?.footer?.rows), 'нет рядов подвала');
  });

  it('раздел закрыт без права на просмотр', async () => {
    const { session } = await createAdmin([]);

    const { status } = await session.get('/admin/layouts');

    assert.equal(status, 403);
  });

  it('с правом на просмотр раскладка видна, но не сохраняется', async () => {
    const { session } = await createAdmin(['panel.layout.read']);

    const read = await session.get('/admin/layouts');

    assert.ok(ok(read.status), `просмотр отвергнут: ${read.status}`);

    const write = await session.patch('/admin/layouts/footer', { mode: 'builder', rows: [row([])], html: '' });

    assert.equal(write.status, 403);
  });

  it('правка сохраняется и видна в публичной раскладке', async () => {
    const { session } = await createAdmin(['panel.layout.read', 'panel.layout.update']);
    const guest = await anonymous();

    const saved = await session.patch('/admin/layouts/footer', {
      mode: 'builder',
      rows: [row([{ id: 'text', type: 'text', text: { ru: 'Своя строка' } }])],
      html: '',
    });

    assert.ok(ok(saved.status), `сохранение отвергнуто: ${saved.status} ${JSON.stringify(saved.body)}`);

    const { body } = await guest.get('/layouts');

    assert.equal(body?.footer?.rows?.[0]?.blocks?.[0]?.text?.ru, 'Своя строка');
  });

  it('скрипты из HTML вырезаются', async () => {
    const { session } = await createAdmin(['panel.layout.read', 'panel.layout.update']);

    const { status, body } = await session.patch('/admin/layouts/footer', {
      mode: 'html',
      rows: [row([])],
      html: '<div>Текст</div><script>alert(1)</script>',
    });

    assert.ok(ok(status), `сохранение отвергнуто: ${status}`);
    assert.ok(!String(body?.html).includes('<script'), `скрипт остался: ${body?.html}`);
    assert.ok(String(body?.html).includes('Текст'), 'полезная разметка потерялась');
  });

  it('неизвестная часть страницы отвергается', async () => {
    const { session } = await createAdmin(['panel.layout.read', 'panel.layout.update']);

    const { status } = await session.patch('/admin/layouts/sidebar', { mode: 'builder', rows: [row([])], html: '' });

    assert.equal(status, 400);
  });

  it('конструктор без рядов не сохраняется', async () => {
    const { session } = await createAdmin(['panel.layout.read', 'panel.layout.update']);

    const { status } = await session.patch('/admin/layouts/footer', { mode: 'builder', rows: [], html: '' });

    assert.equal(status, 400);
  });

  it('владелец правит раскладку без отдельных прав', async () => {
    const admin = await rootSession();

    const { status } = await admin.patch('/admin/layouts/footer', { mode: 'builder', rows: [row([])], html: '' });

    assert.ok(ok(status), `владельцу отказано: ${status}`);
  });
});
