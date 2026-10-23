import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const client = createRequire(new URL('../../client/package.json', import.meta.url));
const Vue = client('vue');
const { renderToString } = client('@vue/server-renderer');
const { parse } = client('@vue/compiler-sfc');
const { compile } = client('@vue/compiler-dom');
const moment = client('moment');
const { descriptor } = parse(await readFile(new URL('../../client/components/PunishmentFeed.vue', import.meta.url), 'utf8'));
const translations = JSON.parse(await readFile(new URL('../src/seeds/locales/ru.json', import.meta.url), 'utf8'));
const render = new Function('Vue', compile(descriptor.template.content, { mode: 'function', prefixIdentifiers: true }).code)(Vue);
const t = (key, vars = {}) => Object.entries(vars).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), translations[key] || key);

export const entry = (changes = {}) => ({
  id: 'case-1', category: 'GAME', kind: 'BAN', subjectUuid: '22222222-2222-4222-8222-222222222222', user: null,
  actor: null, actorName: 'RemoteModerator', scope: { type: 'GROUP', id: 'hitech', name: 'HiTech', servers: [] },
  reason: 'Rule <script>alert(1)</script>', created: '2026-10-22T17:52:28.000Z', expires: null, status: 'ACTIVE', desired: 'ACTIVE', revision: 1,
  delivery: { total: 2, applied: 2, pending: 0, attention: 0 }, ...changes,
});

export async function renderPunishments(data, overrides = {}) {
  const context = { own: false, username: undefined, tabs: ['active', 'history'], tab: 'active', category: '', categories: [], search: '', page: 1, selected: null, buying: false, buyError: '', error: false, loading: false,
    result: { data, counters: { active: data.length, history: 3 }, meta: { itemsPerPage: 25, totalItems: data.length } },
    scopeLabel: (item) => item.scope.name || t(item.category === 'ACCOUNT' ? 'punishments.account_scope' : 'punishments.project_scope'),
    refresh() {}, reset() {}, buy() {}, ...overrides };
  const app = Vue.createSSRApp({ render, setup: () => context });
  app.config.globalProperties.$t = t;
  app.config.globalProperties.$moment = moment;
  app.config.globalProperties.$utils = { formatCurrency: (_, value) => `${value} ₽` };
  app.component('NuxtLink', { props: ['to'], setup: (props, { slots }) => () => Vue.h('a', { href: props.to }, slots.default?.()) });
  for (const name of ['Button','Tag','Message','Skeleton','Paginator','InputText','Select']) app.component(name, { props: ['label','value'], setup: (props, { slots, attrs }) => () => Vue.h(name === 'Button' ? 'button' : 'span', attrs, slots.default?.() || props.label || props.value) });
  app.component('Dialog', { props: ['visible'], setup: (props, { slots }) => () => props.visible ? Vue.h('div', { role: 'dialog' }, [slots.default?.(), slots.footer?.()]) : null });
  return renderToString(app);
}

describe('Shared punishment feed', () => {
  it('renders unknown game UUIDs and remote moderators without broken links or executable reasons', async () => {
    const html = await renderPunishments([entry()]);
    assert.ok(html.includes('22222222-2222-4222-8222-222222222222'));
    assert.ok(html.includes('RemoteModerator'));
    assert.ok(html.includes('HiTech'));
    assert.ok(!html.includes('href='));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(!html.includes('<script>'));
  });
  it('keeps registered profiles and distinguishes account scope from game scope', async () => {
    const html = await renderPunishments([entry({ user: { username: 'Player' }, actor: { username: 'Mod' } }), entry({ id: 'account', category: 'ACCOUNT', scope: { type: 'ACCOUNT', name: '' } })]);
    assert.ok(html.includes('href="/user/Player"'));
    assert.ok(html.includes('href="/user/Mod"'));
    assert.ok(html.includes('Аккаунт проекта и вход в лаунчер'));
    assert.ok(html.includes('Блокировка аккаунта'));
  });
  it('shows the owned purchase action, scoped confirmation and reserve terms', async () => {
    const item = entry({ quote: { available: true, price: 150, reason: null } });
    const html = await renderPunishments([item], { own: true, selected: item });
    assert.ok(html.includes('Купить разбан'));
    assert.ok(html.includes('HiTech'));
    assert.ok(html.includes('зарезервирована'));
    assert.ok(html.includes('Подтвердить за 150'));
  });
  it('shows pending removal and the purchase review state without offering another purchase', async () => {
    const html = await renderPunishments([entry({ desired: 'REVOKED', quote: { available: false }, purchase: { status: 'REVIEW' } })], { own: true });
    assert.ok(html.includes('Снятие выполняется'));
    assert.ok(html.includes('резерв сохранён'));
    assert.ok(!html.includes('Купить разбан'));
  });
});
