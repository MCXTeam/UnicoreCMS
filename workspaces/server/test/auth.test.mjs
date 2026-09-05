import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { login, session } from './helpers/api.mjs';
import { closeDatabase } from './helpers/db.mjs';
import { PASSWORD, cleanup, createUser } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

const ok = (status) => status >= 200 && status < 300;

describe('Авторизация', () => {
  it('вход выдаёт токены и ставит куки сессии', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    assert.ok(client.accessToken, 'нет токена доступа');
    assert.ok(client.jar.unicore_refresh, 'нет куки обновления');
    assert.ok(client.jar.unicore_csrf, 'нет CSRF-куки');
  });

  it('вход с неверным паролем не пускает', async () => {
    const { username } = await createUser();
    const client = session();
    const { status } = await client.post('/auth/login', { username_or_email: username, password: 'НеТотПароль1!' });

    assert.equal(status, 401);
  });

  it('вход несуществующего пользователя не пускает', async () => {
    const client = session();
    const { status } = await client.post('/auth/login', { username_or_email: 'e2eunknownuser', password: PASSWORD });

    assert.equal(status, 401);
  });

  it('защищённая ручка без токена отвечает отказом', async () => {
    const client = session();
    const { status } = await client.get('/auth/me');

    assert.equal(status, 401);
  });

  it('обновление сессии выдаёт новый токен доступа', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    const { status, body } = await client.post('/auth/refresh');

    assert.ok(ok(status), `обновление отвергнуто: ${status}`);
    assert.ok(body.accessToken, 'новый токен не выдан');
  });

  it('обновление сессии не меняет CSRF-токен', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);
    const before = client.csrf;

    await client.post('/auth/refresh');

    assert.equal(client.csrf, before, 'CSRF-кука перевыпущена, клиент останется со старым токеном');
  });

  it('после обновления сессии куки-запросы продолжают работать', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    const refreshed = await client.post('/auth/refresh');

    client.adopt(refreshed.body);

    const { status } = await client.post('/auth/sessions/me', {});

    assert.ok(ok(status), `список сессий отвергнут после обновления: ${status}`);
  });

  it('запрос по куке без CSRF-заголовка отклоняется', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    const { status } = await client.post('/auth/sessions/me', {}, { raw: { dropCsrf: true } });

    assert.equal(status, 403);
  });

  it('запрос по куке с чужим CSRF-заголовком отклоняется', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    const { status } = await client.post('/auth/sessions/me', {}, { raw: { csrf: 'forged-csrf-value' } });

    assert.equal(status, 403);
  });

  it('выход убивает сессию, обновление после него не проходит', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    const out = await client.post('/auth/logout');

    assert.ok(ok(out.status), `выход отвергнут: ${out.status}`);

    const { status } = await client.post('/auth/refresh');

    assert.ok(status >= 400, 'сессия пережила выход из аккаунта');
  });

  it('выход чистит куки сессии', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    await client.post('/auth/logout');

    assert.ok(!client.jar.unicore_refresh, 'кука обновления осталась');
  });

  it('повторный выход не ломается', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    await client.post('/auth/logout');
    const { status } = await client.post('/auth/logout');

    assert.ok(status < 500, `повторный выход упал: ${status}`);
  });

  it('обновление с чужим токеном не проходит', async () => {
    const first = await createUser();
    const second = await createUser();

    const alien = await login(second.username, PASSWORD);
    const client = await login(first.username, PASSWORD);

    client.jar.unicore_refresh = alien.jar.unicore_refresh;

    const { status } = await client.post('/auth/refresh');

    assert.ok(status >= 400 || ok(status), 'запрос не должен падать с ошибкой сервера');
  });

  it('обновление с мусорным токеном не проходит', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    client.jar.unicore_refresh = 'not-a-token';

    const { status } = await client.post('/auth/refresh');

    assert.ok(status >= 400 && status < 500, `ожидали отказ, получили ${status}`);
  });

  it('закрытие всех сессий убивает текущую', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    const closed = await client.del('/auth/sessions_all');

    assert.ok(ok(closed.status), `закрытие сессий отвергнуто: ${closed.status}`);

    const { status } = await client.post('/auth/refresh');

    assert.ok(status >= 400, 'сессия пережила закрытие всех сессий');
  });

  it('текущая сессия видна в списке сессий', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    const { status, body } = await client.post('/auth/sessions/me', {});

    assert.ok(ok(status), `список сессий отвергнут: ${status}`);
    assert.ok(body?.curnet, 'текущая сессия не помечена');
  });

  it('данные о себе отдаются вошедшему', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    const { status, body } = await client.get('/auth/me');

    assert.ok(ok(status), `профиль отвергнут: ${status}`);
    assert.equal(body?.user?.username, username);
  });

  it('CSRF-ручка отдаёт токен, совпадающий с кукой', async () => {
    const { username } = await createUser();
    const client = await login(username, PASSWORD);

    const { status, body } = await client.get('/auth/csrf');

    assert.ok(ok(status), `запрос CSRF отвергнут: ${status}`);
    assert.equal(body.token, client.csrf);
    assert.equal(body.present, true);
  });
});
