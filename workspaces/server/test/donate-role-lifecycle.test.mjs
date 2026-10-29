import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { before, after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { DataSource, EntitySchema } from 'typeorm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const transactional = require('typeorm-transactional');
const source = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
class User {}
class Role {}
class DonateGroup {}
class DonatePermission {}
class UsersDonateGroup {}
class UsersDonatePermission {}
class WebRoleOrigin {}
const models = new Map([
  ['user.entity', { User }], ['role.entity', { Role }], ['donate-group.entity', { DonateGroup }],
  ['donate-permission.entity', { DonatePermission }], ['user-donate.entity', { UsersDonateGroup }],
  ['user-permission.entity', { UsersDonatePermission }], ['web-role-origin.entity', { WebRoleOrigin }],
]);
let db;
let admin;
let database;
let service;
const loaded = new Map();
function load(filename) {
  if (loaded.has(filename)) return loaded.get(filename);
  const exports = {};
  loaded.set(filename, exports);
  const text = readFileSync(resolve(source, filename), 'utf8');
  const compiled = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true, esModuleInterop: true } }).outputText;
  const imports = (name) => {
    for (const [suffix, value] of models) if (name.endsWith(suffix)) return value;
    if (name.endsWith('/ru.json')) return JSON.parse(readFileSync(resolve(source, 'seeds/locales/ru.json'), 'utf8'));
    if (name.endsWith('/en.json')) return JSON.parse(readFileSync(resolve(source, 'seeds/locales/en.json'), 'utf8'));
    if (name === 'unicore-common') return require('unicore-common/permissions');
    if (name === 'typeorm-transactional') return { ...transactional, getDataSourceByName: () => db };
    if (name === '@common') return { SafeCron: () => () => {} };
    if (name === 'unicore-api') return { events: () => ({ emit: async () => {} }) };
    if (name === 'src/events/events.service') return { EventsService: class {} };
    if (name.endsWith('issuance.service')) return { IssuanceService: class {} };
    if (name.endsWith('web-role.service')) return load('game/donate/web-role.service.ts');
    if (name === 'src/common/utils/transaction') return load('common/utils/transaction.ts');
    if (name.endsWith('permission-type.enum')) return { PermissionType: { Web: 'web' } };
    if (name === 'src/admin/roles/grant') return load('admin/roles/grant.ts');
    if (name.includes('permisson.guard')) return load('admin/roles/guards/permisson.guard.ts');
    if (name.includes('important-roles.enum')) return { ImportantRoles: { Default: 'default', Banned: 'banned' } };
    if (name === 'src/common/constants') return { DONATE_PERMS_CACHE_KEY: 'donate', GRANTED_PERMS_CACHE_KEY: 'granted', PERMISSIONS_KEY: 'permissions' };
    return require(name);
  };
  runInNewContext(compiled, { exports, require: imports, Date, Map, Set, console });
  return exports;
}
const columns = (extra = {}) => ({ id: { type: String, primary: true }, ...extra });
const entities = [
  new EntitySchema({ name: 'Role', target: Role, tableName: 'unicore_roles', columns: columns({ name: { type: String }, priority: { type: Number, default: 0 }, important: { type: Boolean, default: false }, staff: { type: Boolean, default: false }, perms: { type: 'simple-array', nullable: true } }) }),
  new EntitySchema({ name: 'User', target: User, tableName: 'unicore_users', columns: { uuid: { type: String, primary: true }, username: { type: String } }, relations: { roles: { type: 'many-to-many', target: 'Role', joinTable: { name: 'unicore_users_roles', joinColumn: { name: 'user_uuid', referencedColumnName: 'uuid' }, inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' } } } } }),
  ...[[DonateGroup, 'DonateGroup', 'unicore_donate_groups'], [DonatePermission, 'DonatePermission', 'unicore_donate_permissions']].map(([target, name, tableName]) => new EntitySchema({ target, name, tableName, columns: columns({ purchasable: { type: Boolean, default: true }, web_perms: { type: 'simple-array', nullable: true } }), relations: { web_role: { type: 'many-to-one', target: 'Role', joinColumn: { name: 'web_role_id' }, nullable: true, onDelete: 'SET NULL' } } })),
  ...[[UsersDonateGroup, 'UsersDonateGroup', 'unicore_users_donate_groups', 'group', 'DonateGroup'], [UsersDonatePermission, 'UsersDonatePermission', 'unicore_users_donate_permissions', 'permission', 'DonatePermission']].map(([target, name, tableName, relation, definition]) => new EntitySchema({ target, name, tableName, columns: columns({ expired: { type: Date, nullable: true } }), relations: { user: { type: 'many-to-one', target: 'User', joinColumn: { name: 'user_uuid' }, onDelete: 'CASCADE' }, [relation]: { type: 'many-to-one', target: definition, joinColumn: { name: relation + '_id' }, eager: true, onDelete: 'CASCADE' } } })),
  new EntitySchema({ name: 'WebRoleOrigin', target: WebRoleOrigin, tableName: 'unicore_web_role_origins', columns: { userUuid: { type: String, name: 'user_uuid', primary: true }, roleId: { type: String, name: 'role_id', primary: true }, manual: { type: Boolean, default: false }, legacy: { type: Boolean, default: false } } }),
];
let sequence = 0;
async function user() {
  const uuid = 'role-test-' + (++sequence);
  await db.getRepository(User).save({ uuid, username: uuid, roles: [{ id: 'default' }] });
  return uuid;
}
const roles = async (uuid) => (await db.getRepository(User).findOne({ where: { uuid }, relations: ['roles'] })).roles.map((role) => role.id).sort();
async function grant(uuid, id = 'vip', kind = 'group', expired = null) {
  const definition = kind === 'group' ? DonateGroup : DonatePermission;
  const row = kind === 'group' ? UsersDonateGroup : UsersDonatePermission;
  const definitionId = 'definition-' + (++sequence);
  await db.getRepository(definition).save({ id: definitionId, web_role: { id } });
  const saved = await db.getRepository(row).save({ id: 'grant-' + (++sequence), user: { uuid }, [kind]: { id: definitionId }, expired });
  await service.syncUser(uuid);
  return { saved, definitionId, row, definition };
}

describe('Donate role lifecycle on MariaDB', { skip: process.env.DONATE_ROLES_TEST !== '1' }, () => {
  before(async () => {
    const options = { ...JSON.parse(process.env.DONATE_ROLES_DB_CONFIG), type: process.env.DONATE_ROLES_DRIVER || 'mariadb' };
    delete options.database;
    admin = await new DataSource(options).initialize();
    database = `donate_roles_test_${process.pid}_${Date.now()}`;
    assert.match(database, /^donate_roles_test_\d+_\d+$/);
    await admin.query(`CREATE DATABASE \`${database}\``);
    transactional.initializeTransactionalContext();
    db = transactional.addTransactionalDataSource(new DataSource({ ...options, database, entities, synchronize: true }));
    await db.initialize();
    const Service = load('game/donate/web-role.service.ts').DonateWebRoleService;
    service = new Service(db);
    await db.getRepository(Role).save([
      { id: 'default', name: 'Player', priority: 0, important: true, perms: [] },
      { id: 'vip', name: 'VIP', priority: 1, perms: ['player.skin.hd'] },
      { id: 'premium', name: 'Premium', priority: 2, perms: ['player.cloak.hd'] },
      { id: 'owner', name: 'Owner', priority: 20, perms: ['panel.access', 'panel.config.update'] },
    ]);
  });
  after(async () => {
    if (db?.isInitialized) await db.destroy();
    if (admin?.isInitialized) {
      if (database) await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
      await admin.destroy();
    }
  });
  it('keeps a role until the last group or permission source is removed', async () => {
    const uuid = await user();
    const first = await grant(uuid);
    const second = await grant(uuid, 'vip', 'permission');
    assert.deepEqual(await roles(uuid), ['default', 'vip']);
    await db.getRepository(first.row).delete(first.saved.id);
    await service.revokeGroupRole(uuid, first.definitionId);
    assert.deepEqual(await roles(uuid), ['default', 'vip']);
    await db.getRepository(second.row).delete(second.saved.id);
    await service.revokePermissionRole(uuid, second.definitionId);
    assert.deepEqual(await roles(uuid), ['default']);
  });
  it('preserves manual roles before and after a donated grant', async () => {
    const uuid = await user();
    await service.syncUser(uuid, ['default', 'vip']);
    const first = await grant(uuid);
    await db.getRepository(first.row).delete(first.saved.id);
    await service.syncUser(uuid);
    assert.deepEqual(await roles(uuid), ['default', 'vip']);
    const second = await grant(uuid, 'premium');
    await service.syncUser(uuid, ['default', 'vip', 'premium']);
    await db.getRepository(second.row).delete(second.saved.id);
    await service.syncUser(uuid);
    assert.deepEqual(await roles(uuid), ['default', 'premium', 'vip']);
  });
  it('removes expired roles before cleanup while keeping other active sources', async () => {
    const uuid = await user();
    const first = await grant(uuid);
    await db.getRepository(first.row).update(first.saved.id, { expired: new Date(Date.now() - 1000) });
    await service.syncUser(uuid);
    assert.deepEqual(await roles(uuid), ['default']);
  });
  it('applies mapping changes and clears without leaking the old role', async () => {
    const uuid = await user();
    const first = await grant(uuid);
    await db.getRepository(first.definition).update(first.definitionId, { web_role: { id: 'premium' } });
    await service.syncGroup(first.definitionId);
    assert.deepEqual(await roles(uuid), ['default', 'premium']);
    await db.getRepository(first.definition).update(first.definitionId, { web_role: null });
    await service.syncGroup(first.definitionId);
    assert.deepEqual(await roles(uuid), ['default']);
  });
  it('serializes concurrent reconciliation and exposes manual and donated roles separately', async () => {
    const uuid = await user();
    await grant(uuid);
    await Promise.all([service.syncUser(uuid), service.syncUser(uuid)]);
    const value = await service.describe(uuid, await db.getRepository(Role).findBy({ id: require('typeorm').In(await roles(uuid)) }));
    assert.deepEqual(Array.from(value.manual_roles), ['default']);
    assert.deepEqual(Array.from(value.donate_roles, (role) => role.id), ['vip']);
  });
  it('blocks linking and giving an ungrantable role and blocks public privileged grants', async () => {
    const limited = { uuid: await user(), perms: ['panel.donate.groups.field.perms'], roles: [{ id: 'limited', priority: 5, perms: [] }], superuser: false };
    await assert.rejects(service.resolveWebRole('owner', { user: limited }), /выдать нельзя/);
    const id = 'secured-definition';
    await db.getRepository(DonateGroup).save({ id, web_role: { id: 'owner' } });
    await assert.rejects(service.assertGroupGrant(id, limited), /выдать нельзя/);
    await assert.rejects(service.assertGroupGrant(id), /покупкой или подарком/);
    await service.assertGroupGrant(id, { superuser: true });
    await db.getRepository(DonateGroup).update(id, { web_role: { id: 'vip' } });
    await service.assertGroupGrant(id);
  });
  it('reuses the real outer transaction and rolls back role and origin writes together', async () => {
    const uuid = await user();
    await db.getRepository(DonateGroup).save({ id: 'rollback-definition', web_role: { id: 'vip' } });
    await assert.rejects(transactional.runInTransaction(async () => {
      await db.getRepository(UsersDonateGroup).save({ id: 'rollback-grant', user: { uuid }, group: { id: 'rollback-definition' }, expired: null });
      await service.syncUser(uuid);
      assert.deepEqual(await roles(uuid), ['default', 'vip']);
      throw new Error('forced rollback');
    }), /forced rollback/);
    assert.deepEqual(await roles(uuid), ['default']);
    assert.equal(await db.getRepository(WebRoleOrigin).countBy({ userUuid: uuid }), 0);
    assert.equal(await db.getRepository(UsersDonateGroup).countBy({ id: 'rollback-grant' }), 0);
  });
  it('does not overwrite a concurrent manual assignment through an older transaction snapshot', async () => {
    const uuid = await user();
    const first = await grant(uuid);
    let opened;
    let resume;
    const snapshotOpened = new Promise((resolve) => { opened = resolve; });
    const canResume = new Promise((resolve) => { resume = resolve; });
    const outer = transactional.runInTransaction(async () => {
      await db.getRepository(WebRoleOrigin).findBy({ userUuid: uuid });
      opened();
      await canResume;
      await service.syncUser(uuid);
    });
    await snapshotOpened;
    try {
      await service.syncUser(uuid, ['default', 'vip']);
      await db.getRepository(first.row).delete(first.saved.id);
    } finally { resume(); }
    await outer;
    assert.deepEqual(await roles(uuid), ['default', 'vip']);
    assert.equal((await db.getRepository(WebRoleOrigin).findOneBy({ userUuid: uuid, roleId: 'vip' })).manual, true);
  });
  it('rejects clearing a stronger mapping and permanently retaining a privileged donor role without grant permission', async () => {
    const actor = { uuid: await user(), superuser: false, roles: [{ id: 'manager', priority: 30, perms: ['panel.access', 'panel.config.update'] }], perms: [] };
    await assert.rejects(service.resolveWebRole(null, { user: actor }, 'owner'), /нет права выдавать права панели/);
    const access = load('admin/roles/grant.ts');
    const owner = await db.getRepository(Role).findOneBy({ id: 'owner' });
    await assert.rejects(access.assertRolesGrantable([owner], [], actor), /нет права выдавать права панели/);
  });
  it('blocks manual-only groups and permissions through every public grant policy', async () => {
    await db.getRepository(DonateGroup).save({ id: 'manual-only-group', purchasable: false, web_role: { id: 'vip' } });
    await db.getRepository(DonatePermission).save({ id: 'manual-only-permission', purchasable: false, web_role: { id: 'vip' } });
    await assert.rejects(service.assertGroupGrant('manual-only-group'), /только администратор/);
    await assert.rejects(service.assertPermissionGrant('manual-only-permission'), /только администратор/);
    await service.assertGroupGrant('manual-only-group', { superuser: true });
    await service.assertPermissionGrant('manual-only-permission', { superuser: true });
  });
  it('expires direct web permissions before the cleanup task deletes the grant', async () => {
    const uuid = await user();
    const first = await grant(uuid);
    await db.getRepository(DonateGroup).update(first.definitionId, { web_perms: ['player.skin.hd'] });
    const guard = load('admin/roles/guards/permisson.guard.ts');
    assert.ok((await guard.playerPermissions({ user: { uuid } })).includes('player.skin.hd'));
    await db.getRepository(first.row).update(first.saved.id, { expired: new Date(Date.now() - 1000) });
    assert.ok(!(await guard.playerPermissions({ user: { uuid } })).includes('player.skin.hd'));
  });
  it('upgrades imported identifier collations in place and installs cascade foreign keys', async () => {
    const upgradeName = database + '_upgrade';
    assert.match(upgradeName, /^donate_roles_test_\d+_\d+_upgrade$/);
    const options = { ...JSON.parse(process.env.DONATE_ROLES_DB_CONFIG), type: process.env.DONATE_ROLES_DRIVER || 'mariadb', database: upgradeName };
    await admin.query(`CREATE DATABASE \`${upgradeName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
    let upgrade;
    let runner;
    try {
      upgrade = await new DataSource(options).initialize();
      await upgrade.query('CREATE TABLE unicore_users (uuid char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin PRIMARY KEY)');
      await upgrade.query('CREATE TABLE unicore_roles (id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY)');
      await upgrade.query('CREATE TABLE unicore_web_role_origins (user_uuid varchar(255),role_id varchar(255),manual tinyint DEFAULT 0,legacy tinyint DEFAULT 0,PRIMARY KEY(user_uuid,role_id))');
      await upgrade.query("INSERT INTO unicore_users VALUES ('legacy')");
      await upgrade.query("INSERT INTO unicore_roles VALUES ('vip')");
      await upgrade.query("INSERT INTO unicore_web_role_origins VALUES ('legacy','vip',1,1)");
      const Migration = load('migrations/steps/1757080000000-web-role-origins.migration.ts').WebRoleOrigins1757080000000;
      runner = upgrade.createQueryRunner();
      await new Migration().up(runner);
      await new Migration().up(runner);
      assert.equal(Number((await upgrade.query('SELECT COUNT(*) AS n FROM unicore_web_role_origins'))[0].n), 1);
      await upgrade.query("DELETE FROM unicore_users WHERE uuid='legacy'");
      assert.equal(Number((await upgrade.query('SELECT COUNT(*) AS n FROM unicore_web_role_origins'))[0].n), 0);
      await upgrade.query("INSERT INTO unicore_users VALUES ('legacy')");
      await upgrade.query("INSERT INTO unicore_web_role_origins VALUES ('legacy','vip',0,0)");
      await upgrade.query("DELETE FROM unicore_roles WHERE id='vip'");
      assert.equal(Number((await upgrade.query('SELECT COUNT(*) AS n FROM unicore_web_role_origins'))[0].n), 0);
    } finally {
      if (runner) await runner.release();
      if (upgrade?.isInitialized) await upgrade.destroy();
      await admin.query(`DROP DATABASE \`${upgradeName}\``);
    }
  });

  it('preserves and flags ambiguous legacy assignments until a manual decision is made', async () => {
    const uuid = await user();
    const manual = await db.getRepository(User).findOne({ where: { uuid }, relations: ['roles'] });
    manual.roles.push(await db.getRepository(Role).findOneBy({ id: 'vip' }));
    await db.getRepository(User).save(manual);
    await db.getRepository(DonateGroup).save({ id: 'legacy-source', web_role: { id: 'vip' } });
    await db.getRepository(UsersDonateGroup).save({ id: 'legacy-source-grant', user: { uuid }, group: { id: 'legacy-source' }, expired: null });
    const Migration = load('migrations/steps/1757080000000-web-role-origins.migration.ts').WebRoleOrigins1757080000000;
    const runner = db.createQueryRunner();
    try { await new Migration().up(runner); } finally { await runner.release(); }
    const origin = await db.getRepository(WebRoleOrigin).findOneBy({ userUuid: uuid, roleId: 'vip' });
    assert.equal(origin.manual, true);
    assert.equal(origin.legacy, true);
    await db.getRepository(UsersDonateGroup).delete('legacy-source-grant');
    await service.syncUser(uuid);
    assert.deepEqual(await roles(uuid), ['default', 'vip']);
    await service.syncUser(uuid, ['default']);
    assert.deepEqual(await roles(uuid), ['default']);
    assert.equal((await db.getRepository(WebRoleOrigin).findOneBy({ userUuid: uuid, roleId: 'vip' })).legacy, false);
  });

  it('does not remove a renewed grant selected earlier by cleanup', async () => {
    const uuid = await user();
    const first = await grant(uuid);
    const cutoff = new Date();
    await db.getRepository(first.row).update(first.saved.id, { expired: new Date(cutoff.getTime() - 1000) });
    const stale = await db.getRepository(first.row).findOneBy({ id: first.saved.id });
    assert.ok(stale.expired < cutoff);
    await db.getRepository(first.row).update(first.saved.id, { expired: new Date(cutoff.getTime() + 3600000) });
    assert.equal(await service.expireGroup(stale.id, cutoff), null);
    assert.equal(await db.getRepository(first.row).countBy({ id: first.saved.id }), 1);
    assert.deepEqual(await roles(uuid), ['default', 'vip']);
    await db.getRepository(first.row).update(first.saved.id, { expired: new Date(cutoff.getTime() - 1000) });
    assert.ok(await service.expireGroup(stale.id, cutoff));
    assert.deepEqual(await roles(uuid), ['default']);
  });

  it('keeps the user lock until expiry removal commands are created and rolls back failed queue writes', async () => {
    const Tasks = load('cron/tasks/donate.tasks.ts').DonateTasks;
    for (const kind of ['group', 'permission']) {
      const uuid = await user();
      const first = await grant(uuid, 'vip', kind, new Date(Date.now() - 1000));
      let queued = false;
      const removal = async () => {
        assert.equal(db.manager.queryRunner?.isTransactionActive, true);
        const other = admin.createQueryRunner();
        try {
          await other.startTransaction();
          await assert.rejects(other.query(`SELECT uuid FROM \`${database}\`.unicore_users WHERE uuid=? FOR UPDATE NOWAIT`, [uuid]), /lock wait timeout|could not obtain|timeout exceeded/i);
        } finally {
          if (other.isTransactionActive) await other.rollbackTransaction();
          await other.release();
        }
        queued = true;
      };
      const tasks = new Tasks(null, null, { emitKernel() {} }, { isRcon: () => true, removeGroup: removal, removePermission: removal }, service);
      const expire = kind === 'group' ? 'expireGroup' : 'expirePermission';
      await tasks[expire](first.saved.id, new Date());
      assert.equal(queued, true);
      assert.equal(await db.getRepository(first.row).countBy({ id: first.saved.id }), 0);
      const retry = await grant(uuid, 'vip', kind, new Date(Date.now() - 1000));
      tasks.issuanceService.removeGroup = tasks.issuanceService.removePermission = async () => { throw new Error('queue write failed'); };
      await assert.rejects(tasks[expire](retry.saved.id, new Date()), /queue write failed/);
      assert.equal(await db.getRepository(retry.row).countBy({ id: retry.saved.id }), 1);
    }
  });

});
