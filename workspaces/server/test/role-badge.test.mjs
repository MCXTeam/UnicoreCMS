import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const workspaces = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const client = createRequire(join(workspaces, 'client/package.json'));
const Vue = client('vue');
const { renderToString } = client('@vue/server-renderer');
const { parse, compileScript } = client('@vue/compiler-sfc');
const { baseParse, compile } = client('@vue/compiler-dom');
let directory;
let PlayerName;
let appearance;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'unicore-badge-'));
  const { descriptor } = parse(await readFile(join(workspaces, 'client/components/PlayerName.vue'), 'utf8'));
  const script = compileScript(descriptor, { id: 'role-badge', inlineTemplate: true });
  const source = `import { computed } from 'vue';
    const useNuxtApp = () => ({ $pub: {apiBaseurl: 'https://cms.test'} });
    const usePublicConfig = () => ({ value: () => false });
    ${script.content}`;
  const outfile = join(directory, 'badge.cjs');
  await build({
    stdin: { contents: source, loader: 'ts', resolveDir: join(workspaces, 'client') },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    alias: { vue: client.resolve('vue'), 'unicore-common/roles': join(workspaces, 'common/src/roles.ts') },
    external: [client.resolve('vue')],
  });
  PlayerName = require(outfile).default;
  const roles = join(directory, 'roles.cjs');
  await build({ entryPoints: [join(workspaces, 'common/src/roles.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: roles });
  appearance = require(roles);
});

after(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});

const role = { name: 'Владелец', badge: true, badge_image: 'roles/owner.png', badge_effect: 2 };

function imageBadge(html) {
  assert.equal((html.match(/<img\b/g) || []).length, 1);
  assert.ok(html.includes('src="https://cms.test/roles/owner.png"'));
  assert.ok(html.includes('alt="Владелец"'));
  assert.ok(!html.includes('>Владелец<'), 'название не должно накладываться на картинку');
  assert.ok(!html.includes('background-image'));
}

describe('Картинка плашки роли', () => {
  it('показывает исходную картинку без второго текста в обычном и вертикальном PlayerName', async () => {
    for (const stacked of [false, true])
      imageBadge(await renderToString(Vue.createSSRApp(PlayerName, { username: 'Steve', role, stacked })));
  });

  it('отключает эффекты текстовой плашки для изображения', () => {
    for (const badge_effect of [0, 1, 2, 3]) {
      assert.deepEqual(appearance.roleBadgeClass({ ...role, badge_effect }), ['role-badge', 'role-badge--image']);
      assert.deepEqual(appearance.roleBadgeStyle({ ...role, badge_effect }), {});
    }
  });

  it('сохраняет текст и градиент после удаления изображения', async () => {
    const textRole = { ...role, badge_image: null };
    const html = await renderToString(Vue.createSSRApp(PlayerName, { username: 'Steve', role: textRole }));
    assert.ok(!html.includes('<img'));
    assert.ok(html.includes('Владелец'));
    assert.ok(html.includes('role-badge--animated'));
    assert.ok(appearance.roleBadgeStyle(textRole).background.startsWith('linear-gradient'));
  });

  it('использует такую же картинку в таблице и предпросмотре админки', async () => {
    const { descriptor } = parse(await readFile(join(workspaces, 'admin/pages/roles.vue'), 'utf8'));
    const tree = baseParse(descriptor.template.content);
    const fragments = [];
    function visit(node) {
      if (node.tag === 'span' && node.props?.some((prop) => prop.name === 'bind' && prop.arg?.content === 'class' && ['badgeClass(slotProps.data)', 'previewBadgeClass'].includes(prop.exp?.content)))
        fragments.push(node.loc.source);
      for (const child of node.children || []) visit(child);
    }
    visit(tree);
    assert.equal(fragments.length, 2);
    for (const template of fragments) {
      const render = new Function('Vue', compile(template, { mode: 'function', prefixIdentifiers: true }).code)(Vue);
      const component = {
        render,
        setup: () => ({
          role, slotProps: { data: role }, apiUrl: 'https://cms.test',
          badgeClass: appearance.roleBadgeClass, badgeStyle: appearance.roleBadgeStyle,
          previewBadgeClass: appearance.roleBadgeClass(role), previewBadgeStyle: appearance.roleBadgeStyle(role),
        }),
      };
      imageBadge(await renderToString(Vue.createSSRApp(component)));
    }
  });
});
