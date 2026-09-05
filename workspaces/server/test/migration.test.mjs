import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const esbuildBinary = join(dirname(require.resolve('esbuild/package.json')), 'bin', 'esbuild');

const here = dirname(fileURLToPath(import.meta.url));

const source = resolve(here, '..', 'src', 'migrations', 'steps', '1756820000000-permission-additions.migration.ts');

let workdir = null;
let Migration = null;

before(async () => {
  workdir = mkdtempSync(join(tmpdir(), 'unicore-migration-'));

  const outfile = join(workdir, 'migration.cjs');

  execFileSync(
    process.execPath,
    [esbuildBinary, source, '--bundle', '--platform=node', '--format=cjs', '--external:typeorm', `--outfile=${outfile}`],
    { stdio: 'ignore' },
  );

  const module = await import(`file://${outfile.replace(/\\/g, '/')}`);

  Migration = module.PermissionAdditions1756820000000 ?? module.default?.PermissionAdditions1756820000000;
});

after(() => {
  if (workdir) rmSync(workdir, { recursive: true, force: true });
});

async function migrate(perms) {
  let stored = perms.join(',');

  const runner = {
    getTable: async (table) => (table === 'unicore_roles' ? { findColumnByName: () => true } : null),
    query: async (sql, params) => {
      if (sql.startsWith('SELECT')) return [{ row_key: 'test', value: stored }];

      stored = params[0];

      return [];
    },
  };

  await new Migration().up(runner);

  return stored.split(',').filter(Boolean);
}

const same = (got, want) => got.length === want.length && want.every((item) => got.includes(item));

describe('Миграция новых прав', () => {
  it('скоуп доходности переносится на топ покупок', async () => {
    const got = await migrate(['panel.access', 'panel.revenue.read.hitech']);

    assert.ok(
      same(got, ['panel.access', 'panel.revenue.read.hitech', 'panel.revenue.access', 'panel.revenue.items.hitech']),
      `получили: ${got.join(', ')}`,
    );
  });

  it('полная доходность даёт топ покупок на все серверы', async () => {
    const got = await migrate(['panel.revenue.read']);

    assert.ok(same(got, ['panel.revenue.read', 'panel.revenue.access', 'panel.revenue.items']), `получили: ${got.join(', ')}`);
  });

  it('правка одного сервера не даёт глобальную сортировку', async () => {
    const got = await migrate(['panel.servers.update.hitech']);

    assert.ok(same(got, ['panel.servers.update.hitech']), `получили: ${got.join(', ')}`);
  });

  it('полная правка серверов даёт сортировку', async () => {
    const got = await migrate(['panel.servers.update']);

    assert.ok(same(got, ['panel.servers.update', 'panel.servers.sort']), `получили: ${got.join(', ')}`);
  });

  it('серверные скоупы модов схлопываются', async () => {
    const got = await migrate(['panel.mods.read.hitech', 'panel.mods.delete.many.hitech', 'panel.mods.delete.hitech']);

    assert.ok(same(got, ['panel.mods.read', 'panel.mods.delete.many', 'panel.mods.delete']), `получили: ${got.join(', ')}`);
  });

  it('rcon на сервере даёт настройку выдачи', async () => {
    const got = await migrate(['panel.servers.rcon.hitech']);

    assert.ok(same(got, ['panel.servers.rcon.hitech', 'panel.servers.issuance']), `получили: ${got.join(', ')}`);
  });

  it('правка страниц даёт их просмотр', async () => {
    const got = await migrate(['panel.pages.update']);

    assert.ok(same(got, ['panel.pages.update', 'panel.pages.read']), `получили: ${got.join(', ')}`);
  });

  it('правка пользователей даёт скин и плащ', async () => {
    const got = await migrate(['panel.users.update']);

    assert.ok(same(got, ['panel.users.update', 'panel.users.skin', 'panel.users.cloak']), `получили: ${got.join(', ')}`);
  });

  it('выдача прав панели даёт настройку прав ролей', async () => {
    const got = await migrate(['panel.users.grant.panel']);

    assert.ok(same(got, ['panel.users.grant.panel', 'panel.roles.grant.panel']), `получили: ${got.join(', ')}`);
  });

  it('ничего лишнего не добавляется', async () => {
    const got = await migrate(['panel.access', 'panel.users.read']);

    assert.ok(same(got, ['panel.access', 'panel.users.read']), `получили: ${got.join(', ')}`);
  });
});
