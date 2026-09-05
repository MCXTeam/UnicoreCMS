import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);

const {
  anyScope,
  canEditField,
  guardedFields,
  longestScope,
  resolvePermissions,
  satisfiesPermission,
  scopeOf,
} = require('unicore-common/permissions');

describe('Разбор серверного скоупа', () => {
  it('суффикс сервера относится к самому длинному праву', () => {
    assert.equal(scopeOf('panel.donate.groups.delete.many.2'), 'panel.donate.groups.delete.many');
  });

  it('одиночное право не перехватывает чужой суффикс', () => {
    assert.equal(scopeOf('panel.donate.groups.delete.2'), 'panel.donate.groups.delete');
  });

  it('известное право скоупом не считается', () => {
    assert.equal(scopeOf('panel.donate.groups.delete.many'), null);
  });

  it('longestScope выбирает длиннейшее совпадение', () => {
    assert.equal(longestScope('a.b.c.d', ['a.b', 'a.b.c']), 'a.b.c');
  });
});

describe('Проверка прав', () => {
  it('право «удалять» не открывает «удалять списком»', () => {
    assert.equal(satisfiesPermission(['panel.donate.groups.delete'], 'panel.donate.groups.delete.many.2'), false);
  });

  it('право «править» не открывает «править списком»', () => {
    assert.equal(satisfiesPermission(['panel.store.products.update'], 'panel.store.products.update.many.2'), false);
  });

  it('право без скоупа действует на любом сервере', () => {
    assert.equal(satisfiesPermission(['panel.donate.groups.delete.many'], 'panel.donate.groups.delete.many.7'), true);
  });

  it('право со скоупом действует только на своём сервере', () => {
    assert.equal(satisfiesPermission(['panel.donate.groups.delete.many.2'], 'panel.donate.groups.delete.many.2'), true);
    assert.equal(satisfiesPermission(['panel.donate.groups.delete.many.2'], 'panel.donate.groups.delete.many.3'), false);
  });

  it('anyScope принимает право на любом сервере', () => {
    assert.equal(satisfiesPermission(['panel.store.products.create.hitech'], anyScope('panel.store.products.create')), true);
    assert.equal(satisfiesPermission(['panel.store.products.create.hitech'], 'panel.store.products.create'), false);
  });

  it('anyScope ничего не меняет для прав без скоупа', () => {
    assert.equal(anyScope('panel.users.read'), 'panel.users.read');
  });

  it('маска не выдаёт опасные права', () => {
    assert.equal(satisfiesPermission(['panel.*'], 'panel.config.update'), false);
    assert.equal(satisfiesPermission(['panel.*'], 'panel.users.read'), true);
  });

  it('явная выдача опасного права работает', () => {
    assert.equal(satisfiesPermission(['panel.config.update'], 'panel.config.update'), true);
  });

  it('запрет перебивает выдачу', () => {
    assert.equal(satisfiesPermission(['panel.users.read', '!panel.users.read'], 'panel.users.read'), false);
  });

  it('запрет перебивает маску', () => {
    assert.equal(satisfiesPermission(['panel.*', '!panel.users.read'], 'panel.users.read'), false);
  });

  it('разбор маски не тянет опасные права', () => {
    const resolved = resolvePermissions(['panel.*']);

    assert.ok(resolved.includes('panel.users.read'));
    assert.ok(!resolved.includes('panel.config.update'));
  });
});

describe('Выдача роли по правам выдающего', () => {
  const universe = require('unicore-common/permissions').permissionUniverse();

  const grantable = (actorPerms, rolePerms) => {
    const granted = new Set(resolvePermissions(actorPerms, universe));

    return resolvePermissions(rolePerms, universe).every((permission) => granted.has(permission));
  };

  it('роль с правами сильнее своих выдать нельзя', () => {
    assert.equal(grantable(['panel.access', 'panel.users.read'], ['panel.*']), false);
  });

  it('роль в пределах своих прав выдать можно', () => {
    assert.equal(grantable(['panel.access', 'panel.users.read'], ['panel.users.read']), true);
  });

  it('маска у выдающего покрывает роль без опасных прав', () => {
    assert.equal(grantable(['panel.*'], ['panel.users.read', 'panel.news.read']), true);
  });

  it('маска у выдающего не покрывает роль с опасным правом', () => {
    assert.equal(grantable(['panel.*'], ['panel.config.update']), false);
  });

  it('пустая роль выдаётся всегда', () => {
    assert.equal(grantable([], []), true);
  });
});

describe('Ограничения полей', () => {
  it('цена доната закрыта только при редактировании', () => {
    assert.equal(canEditField('donate_group', 'price', [], false), true);
    assert.equal(canEditField('donate_group', 'price', [], true), false);
  });

  it('почта пользователя закрыта только при редактировании', () => {
    assert.equal(canEditField('user', 'email', [], false), true);
    assert.equal(canEditField('user', 'email', [], true), false);
  });

  it('владелец закрыт всегда', () => {
    assert.equal(canEditField('user', 'superuser', [], false), false);
    assert.equal(canEditField('user', 'superuser', [], true), false);
  });

  it('веб-права доната закрыты всегда', () => {
    assert.equal(canEditField('donate_permission', 'web_perms', [], false), false);
  });

  it('игровые права доната не ограничены полем', () => {
    assert.equal(canEditField('donate_permission', 'perms', [], true), true);
    assert.ok(!guardedFields('donate_permission').includes('perms'));
  });

  it('цена кита магазина под охраной', () => {
    assert.ok(guardedFields('store_kit').includes('price'));
  });

  it('право на поле открывает его и при редактировании', () => {
    assert.equal(canEditField('donate_group', 'price', ['panel.donate.groups.field.price'], true), true);
  });
});
