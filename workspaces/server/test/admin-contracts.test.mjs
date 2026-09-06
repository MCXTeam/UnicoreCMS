import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);

const { guardedFields, permissionMeta, permissionUniverse } = require('unicore-common/permissions');

const admin = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'admin');

const universe = new Set(permissionUniverse());

function pages(dir) {
  const found = [];

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) found.push(...pages(path));
    else if (entry.endsWith('.vue')) found.push(path);
  }

  return found;
}

const sources = [...pages(join(admin, 'pages')), ...pages(join(admin, 'components'))].map((path) => ({
  file: relative(admin, path).replace(/\\/g, '/'),
  text: readFileSync(path, 'utf8'),
}));

const values = (body) => [...body.matchAll(/:\s*'([^']+)'/g)].map((match) => match[1]);

const calls = (text, pattern) => [...text.matchAll(pattern)];

describe('Права, на которые ссылается админка', () => {
  it('маршруты закрыты существующими правами', () => {
    const text = readFileSync(join(admin, 'constants', 'access.ts'), 'utf8');
    const block = text.slice(text.indexOf('ROUTE_ACCESS'), text.indexOf('export function routeAccess'));
    const unknown = [...block.matchAll(/'((?:panel|player)\.[^']*)'/g)]
      .map((match) => match[1])
      .filter((permission) => !universe.has(permission));

    assert.deepEqual(unknown, [], `в constants/access.ts есть несуществующие права: ${unknown.join(', ')}`);
  });

  it('useAccess и useScopedAccess ссылаются на существующие права', () => {
    const unknown = [];

    for (const { file, text } of sources)
      for (const [, body] of calls(text, /use(?:Scoped)?Access\(\{([\s\S]*?)\}\)/g))
        for (const permission of values(body)) if (!universe.has(permission)) unknown.push(`${file}: ${permission}`);

    assert.deepEqual(unknown, [], `права не найдены в каталоге:\n${unknown.join('\n')}`);
  });

  it('useServerScope ссылается на права со скоупом по серверам', () => {
    const wrong = [];

    for (const { file, text } of sources)
      for (const [, permission] of calls(text, /useServerScope\('([^']+)'\)/g))
        if (permissionMeta(permission)?.scope !== 'server') wrong.push(`${file}: ${permission}`);

    assert.deepEqual(wrong, [], `права без серверного скоупа:\n${wrong.join('\n')}`);
  });

  it('useFieldAccess ссылается на поля, которые каталог действительно охраняет', () => {
    const unguarded = [];

    for (const { file, text } of sources)
      for (const [, entity, body] of calls(text, /useFieldAccess\('([^']+)',\s*\{([\s\S]*?)\}\)/g)) {
        const guarded = guardedFields(entity);

        for (const field of values(body)) if (!guarded.includes(field)) unguarded.push(`${file}: ${entity}.${field}`);
      }

    assert.deepEqual(unguarded, [], `поле не связано ни с одним правом, замок в интерфейсе не сработает:\n${unguarded.join('\n')}`);
  });
});
