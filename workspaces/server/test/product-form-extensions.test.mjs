import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const workspaces = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const admin = createRequire(join(workspaces, 'admin/package.json'));
const { parse } = admin('@vue/compiler-sfc');
const apiPath = join(workspaces, 'api/dist/admin/index.js');
const { createAdminForm, setActiveModules } = require(apiPath);
let directory, page;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'unicore-product-form-'));
  const source = await readFile(join(workspaces, 'admin/pages/store/products.vue'), 'utf8');
  const { descriptor } = parse(source);
  const outfile = join(directory, 'products.cjs');
  await build({
    stdin: { contents: descriptor.script.content, resolveDir: join(workspaces, 'admin'), loader: 'js' },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    alias: { 'unicore-api/admin': apiPath, vue: admin.resolve('vue') },
    external: [apiPath, admin.resolve('vue')],
    plugins: [{
      name: 'page-dependencies',
      setup(build) {
        build.onResolve({ filter: /^(~\/helpers|@primevue\/core\/api|vee-validate)$/ }, (args) => ({ path: args.path, namespace: 'stub' }));
        build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: "export const sortTransform = () => {}; export const FilterMatchMode = { CONTAINS: 'contains', IN: 'in' }; export const Form = {}; export const Field = {};" }));
      },
    }],
  });
  page = require(outfile).default;
});

after(async () => {
  setActiveModules(null);
  if (directory) await rm(directory, { recursive: true, force: true });
});

function fixture(id = null) {
  const calls = { post: 0, patch: 0, load: 0, translations: 0, notices: [] };
  const context = {
    ...page.data(),
    $_: require('lodash'),
    $t: (key) => key,
    $toast: { add: (notice) => calls.notices.push(notice) },
    $api: {
      async post() { calls.post++; return { data: { id: 123 } }; },
      async patch() { calls.patch++; },
    },
    translations: { async save() { calls.translations++; } },
  };
  for (const [key, method] of Object.entries(page.methods)) context[key] = method.bind(context);
  Object.assign(context.product, { id, name: 'Ticket', price: 5, servers: [{ id: 'metro' }], categories: [] });
  context.loading = false;
  context.productDialog = true;
  context.productFormReady = true;
  context.updateMode = id != null;
  context.productForm = createAdminForm('store.product', () => ({ id: context.product.id, mode: context.updateMode ? 'edit' : 'create', value: context.product }));
  context.load = async () => { calls.load++; context.loading = false; context.hideDialog(); };
  return { context, calls };
}

test('ошибка проверки модуля не создаёт товар и оставляет карточку открытой', async () => {
  const { context, calls } = fixture();
  context.productForm.context.register('ticket', { validate() { throw new Error('invalid'); } });
  await context.saveProduct();
  assert.equal(calls.post, 0);
  assert.equal(calls.patch, 0);
  assert.equal(context.productDialog, true);
  assert.equal(context.productFormError, 'admin.extension_form_invalid');
  assert.equal(context.loading, false);
});

test('ошибка настройки после POST сохраняет ID, повтор завершает сохранение без нового товара', async () => {
  const { context, calls } = fixture();
  let attempt = 0;
  context.productForm.context.register('ticket', { save(record) { assert.equal(record.id, 123); if (++attempt === 1) throw new Error('offline'); } });
  await context.saveProduct();
  assert.equal(context.product.id, 123);
  assert.equal(context.updateMode, true);
  assert.equal(context.productDialog, true);
  assert.equal(context.productFormError, 'admin.extension_form_save_failed');
  assert.equal(calls.load, 0);
  await context.saveProduct();
  assert.equal(calls.post, 1);
  assert.equal(calls.patch, 0);
  assert.equal(attempt, 2);
  assert.equal(calls.load, 1);
  assert.equal(context.productDialog, false);
});

test('при изменении основного черновика после частичного сбоя повтор обновляет сохранённый товар', async () => {
  const { context, calls } = fixture();
  let attempt = 0;
  context.productForm.context.register('ticket', { save() { if (++attempt === 1) throw new Error('offline'); } });
  await context.saveProduct();
  context.product.name = 'Updated ticket';
  await context.saveProduct();
  assert.equal(calls.post, 1);
  assert.equal(calls.patch, 1);
});

test('неудачная загрузка запрещает сохранение, повтор загрузки восстанавливает форму', async () => {
  const { context, calls } = fixture(7);
  let attempt = 0;
  context.productForm.context.register('ticket', { load() { if (++attempt === 1) throw new Error('offline'); } });
  await context.loadProductExtensions();
  assert.equal(context.productFormReady, false);
  await context.saveProduct();
  assert.equal(calls.patch, 0);
  await context.loadProductExtensions();
  assert.equal(context.productFormReady, true);
  await context.saveProduct();
  assert.equal(calls.patch, 1);
});

test('отмена сбрасывает черновик модуля без запросов сохранения', () => {
  const { context, calls } = fixture(7);
  let resets = 0;
  context.productForm.context.register('ticket', { reset() { resets++; } });
  context.hideDialog();
  assert.equal(resets, 1);
  assert.equal(context.productForm, null);
  assert.equal(calls.post + calls.patch, 0);
});

test('ошибка переводов после POST также не создаёт дубликат при повторе', async () => {
  const { context, calls } = fixture();
  let attempt = 0;
  context.translations.save = async () => { if (++attempt === 1) throw new Error('offline'); };
  await context.saveProduct();
  assert.equal(context.product.id, 123);
  await context.saveProduct();
  assert.equal(calls.post, 1);
  assert.equal(calls.patch, 0);
});
