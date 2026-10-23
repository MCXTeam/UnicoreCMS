import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire, Module as NodeModule } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const { Module, SetMetadata } = require('@nestjs/common');
const { NestFactory, Reflector } = require('@nestjs/core');
function load(path, stubs) {
  const filename = fileURLToPath(new URL('../src/' + path, import.meta.url));
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true, emitDecoratorMetadata: true } });
  const loaded = new NodeModule(filename);
  loaded.paths = require.resolve.paths('@nestjs/common');
  loaded.require = (name) => name in stubs ? stubs[name] : require(name);
  loaded._compile(output.outputText, filename);
  return loaded.exports;
}

test('the real setup route requires its own permission and cannot be invoked through prepare access', async () => {
  let connected = 0;
  class UpdatesService { request() { return { configured: false }; } }
  class UpdatesSetupService { discover() { return { checks: { linux: true } }; } connect() { connected++; return { state: 'connecting' }; } pterodactyl() { connected++; return { state: 'restarting' }; } }
  const constants = { PERMISSIONS_KEY: 'permissions', GRANTED_PERMS_CACHE_KEY: 'grantedPermsCache', DONATE_PERMS_CACHE_KEY: '__donateWebPerms' };
  const permissions = load('admin/roles/decorators/permission.decorator.ts', { 'src/common/constants': constants });
  const { UpdatesController } = load('admin/updates/updates.controller.ts', {
    '@common': { Audit: () => () => {} }, '../roles/decorators/permission.decorator': permissions,
    './updates.service': { UpdatesService }, './updates-setup.service': { UpdatesSetupService }, './updates.input': { UpdatesInput: class {} },
    './pterodactyl-setup.input': { PterodactylSetupInput: class {} },
  });
  const { PermissionGuard } = load('admin/roles/guards/permisson.guard.ts', {
    'unicore-common': require('unicore-common/permissions'), 'src/common/constants': constants,
    '../enums/important-roles.enum': { ImportantRoles: { Banned: 'banned' } },
    'src/game/donate/groups/entities/user-donate.entity': { UsersDonateGroup: class {} },
    'src/game/donate/permissions/entities/user-permission.entity': { UsersDonatePermission: class {} },
  });
  class Fixture {}
  Module({ controllers: [UpdatesController], providers: [UpdatesService, UpdatesSetupService] })(Fixture);
  const app = await NestFactory.create(Fixture, { logger: false });
  app.use((req, _res, next) => {
    req.user = { superuser: false };
    req.grantedPermsCache = ['panel.access', 'panel.updates.read', ...(req.headers['x-test-rights'] || '').split(',')];
    next();
  });
  app.useGlobalGuards(new PermissionGuard(new Reflector()));
  await app.listen(0, '127.0.0.1');
  try {
    const url = await app.getUrl();
    assert.equal((await fetch(url + '/admin/updates/setup')).status, 200);
    assert.equal((await fetch(url + '/admin/updates/setup', { method: 'POST' })).status, 403);
    assert.equal((await fetch(url + '/admin/updates/setup', { method: 'POST', headers: { 'x-test-rights': 'panel.updates.prepare' } })).status, 403);
    assert.equal(connected, 0);
    assert.equal((await fetch(url + '/admin/updates/setup', { method: 'POST', headers: { 'x-test-rights': 'panel.updates.setup' } })).status, 201);
    assert.equal(connected, 1);
    assert.equal((await fetch(url + '/admin/updates/setup/pterodactyl', { method: 'POST', headers: { 'x-test-rights': 'panel.updates.prepare' } })).status, 403);
    assert.equal(connected, 1);
    assert.equal((await fetch(url + '/admin/updates/setup/pterodactyl', { method: 'POST', headers: { 'x-test-rights': 'panel.updates.setup' } })).status, 201);
    assert.equal(connected, 2);
  } finally { await app.close(); }
});
