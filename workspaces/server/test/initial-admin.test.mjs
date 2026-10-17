import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const server = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let directory;
let createInitialAdmin;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'unicore-initial-admin-'));
  const outfile = join(directory, 'initial-admin.cjs');
  await build({
    entryPoints: [join(server, 'src/admin/users/initial-admin.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
  });
  ({ createInitialAdmin } = require(outfile));
});

after(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});

function installation(existing = 0) {
  const users = [];
  const output = [];
  let tail = Promise.resolve();
  let released = 0;
  const dataSource = {
    options: { type: 'mariadb' },
    createQueryRunner() {
      let unlock;
      return {
        async connect() {},
        async query(sql) {
          if (sql.includes('GET_LOCK')) {
            const previous = tail;
            tail = new Promise((resolve) => { unlock = resolve; });
            await previous;
            return [{ acquired: 1 }];
          }
          if (sql.includes('RELEASE_LOCK')) unlock();
        },
        async release() { released++; },
      };
    },
  };
  const service = {
    async count() { return existing + users.length; },
    async create(input) { users.push({ ...input }); },
  };
  const run = (file) => createInitialAdmin(dataSource, service, file, (message) => output.push(message));
  return { users, output, service, dataSource, run, released: () => released };
}

describe('Администратор первой установки', () => {
  it('по умолчанию пишет данные прямо в stdout', async () => {
    const site = installation();
    const file = join(directory, 'stdout.txt');
    const write = process.stdout.write;
    const chunks = [];
    try {
      process.stdout.write = (chunk) => { chunks.push(String(chunk)); return true; };
      await createInitialAdmin(site.dataSource, site.service, file);
    } finally {
      process.stdout.write = write;
    }
    assert.ok(chunks.join('').includes(await readFile(file, 'utf8')));
  });

  it('создаёт активного суперпользователя и сохраняет тот же пароль в файл и консоль один раз', async () => {
    const site = installation();
    const file = join(directory, 'first.txt');
    await site.run(file);
    assert.equal(site.users.length, 1);
    const user = site.users[0];
    assert.equal(user.username, 'admin');
    assert.equal(user.superuser, true);
    assert.equal(user.activated, true);
    assert.equal(user.password.length, 24);
    const contents = await readFile(file, 'utf8');
    assert.ok(contents.includes(`Пароль: ${user.password}`));
    assert.ok(site.output[0].includes(contents));
    if (process.platform !== 'win32') assert.equal((await stat(file)).mode & 0o777, 0o600);
    await site.run(file);
    assert.equal(site.users.length, 1);
    assert.equal(site.output.length, 1);
    assert.equal(await readFile(file, 'utf8'), contents);
    assert.equal(site.released(), 2);
  });

  it('оставляет существующий сайт без изменений, даже если там нет администратора', async () => {
    const site = installation(1);
    const file = join(directory, 'existing.txt');
    await site.run(file);
    assert.deepEqual(site.users, []);
    assert.deepEqual(site.output, []);
    await assert.rejects(readFile(file), { code: 'ENOENT' });
  });

  it('не создаёт учётную запись, если файл нельзя записать', async () => {
    const site = installation();
    await assert.rejects(site.run(join(directory, 'missing', 'credentials.txt')), { code: 'ENOENT' });
    assert.deepEqual(site.users, []);
    assert.deepEqual(site.output, []);
    assert.equal(site.released(), 1);
  });

  it('сохраняет старый файл и прекращает установку при конфликте', async () => {
    const site = installation();
    const file = join(directory, 'protected.txt');
    await writeFile(file, 'existing credentials');
    await assert.rejects(site.run(file), { code: 'EEXIST' });
    assert.equal(await readFile(file, 'utf8'), 'existing credentials');
    assert.deepEqual(site.users, []);
  });

  it('удаляет файл при ошибке создания пользователя и допускает повторную попытку', async () => {
    const site = installation();
    const file = join(directory, 'retry.txt');
    const create = site.service.create;
    site.service.create = async () => { throw new Error('database failure'); };
    await assert.rejects(site.run(file), /database failure/);
    await assert.rejects(readFile(file), { code: 'ENOENT' });
    assert.deepEqual(site.output, []);
    site.service.create = create;
    await site.run(file);
    assert.equal(site.users.length, 1);
  });

  it('при одновременных запусках создаёт единственного администратора', async () => {
    const site = installation();
    const file = join(directory, 'concurrent.txt');
    await Promise.all([site.run(file), site.run(file), site.run(file)]);
    assert.equal(site.users.length, 1);
    assert.equal(site.output.length, 1);
    assert.equal(site.released(), 3);
  });

  it('при таймауте блокировки не создаёт файл и освобождает соединение', async () => {
    const site = installation();
    const file = join(directory, 'timeout.txt');
    let released = false;
    site.dataSource.createQueryRunner = () => ({
      async connect() {},
      async query() { return [{ acquired: 0 }]; },
      async release() { released = true; },
    });
    await assert.rejects(site.run(file), /блокировку/);
    assert.ok(released);
    assert.deepEqual(site.users, []);
    await assert.rejects(readFile(file), { code: 'ENOENT' });
  });
});
