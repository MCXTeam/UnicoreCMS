import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import { test } from 'node:test'
const require = createRequire(new URL('../package.json', import.meta.url))
const ts = require('typescript')
const { parse } = require('vue/compiler-sfc')
function method(file, name) {
  const { descriptor } = parse(readFileSync(new URL('../pages/' + file, import.meta.url), 'utf8'))
  const source = ts.createSourceFile(file, descriptor.script.content, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  let found
  function visit(node) {
    if (ts.isMethodDeclaration(node) && node.name.getText(source) === name) found = node
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(found, `${file} ${name}`)
  return vm.runInNewContext('({' + found.getText(source) + '})', { NEWS_PANEL_SCOPE: require('unicore-common').NEWS_PANEL_SCOPE })[name]
}
for (const file of [
  'api.vue',
  'email.vue',
  'gifts.vue',
  'mods.vue',
  'news.vue',
  'pages.vue',
  'payment.vue',
  'referals.vue',
  'roles.vue',
  'servers.vue',
  'votes.vue',
  'webhooks.vue',
  'donate/groups.vue',
  'donate/kits.vue',
  'donate/periods.vue',
  'donate/permissions.vue',
  'store/categories.vue',
  'store/kits.vue',
  'store/products.vue',
  'users/index.vue',
]) {
  test(`${file}: failed loading releases spinner and reports error`, async () => {
    let called = 0
    const notices = []
    const toast = { add: (notice) => notices.push(notice) }
    const state = {
      loading: true,
      selected: [],
      filtersTansformer: () => ({}),
      ...Object.fromEntries(
        ['users', 'news', 'mods', 'categories', 'products', 'kits', 'gifts', 'referals'].map((key) => [key, { meta: {} }]),
      ),
      filters: { global: { value: '' } },
      $t: (key) => key,
      toast,
      $toast: toast,
      $api: {
        get: async () => {
          called++
          throw Error('Network Error')
        },
      },
    }
    await assert.doesNotReject(method(file, 'load').call(state))
    assert.ok(called > 0)
    assert.equal(state.loading, false)
    assert.equal(notices.at(-1)?.severity, 'error')
  })
}
for (const [file, name] of [
  ['roles.vue', 'createRole'],
  ['pages.vue', 'createPage'],
  ['pages.vue', 'updatePage'],
  ['servers.vue', 'createServer'],
]) {
  test(`${file}.${name}: network failure releases spinner and reports error`, async () => {
    const notices = []
    const toast = { add: (notice) => notices.push(notice) }
    const state = {
      loading: false,
      page: { id: 1 },
      server: { id: 'qa', mods: [] },
      payload: () => ({}),
      instancesIncomplete: () => false,
      instancesPayload: () => [],
      $_: { omit: (value) => value },
      $t: (key) => key,
      toast,
      $toast: toast,
      $api: {
        post: async () => {
          throw Error('Network Error')
        },
        patch: async () => {
          throw Error('Network Error')
        },
      },
    }
    await assert.doesNotReject(method(file, name).call(state))
    assert.equal(state.loading, false)
    assert.equal(notices.at(-1)?.severity, 'error')
  })
}
for (const file of ['modules.vue', 'themes.vue', 'logs.vue', 'revenue.vue', 'locales.vue']) {
  test(`${file}: failed refresh keeps existing data and reports error`, async () => {
    const notices = []
    let calls = 0
    const state = {
      loading: false,
      modules: [{ id: 'demo' }],
      themes: [{ id: 'aurora' }],
      locked: { client: true, admin: true },
      range: {},
      canRevenue: true,
      canItems: true,
      locales: [{ code: 'ru' }],
      keys: ['qa.key'],
      params: () => ({}),
      $t: (key) => key,
      $toast: { add: (n) => notices.push(n) },
      $api: {
        get: async () => {
          calls++
          throw Error('Network Error')
        },
      },
    }
    await assert.doesNotReject(method(file, 'load').call(state))
    assert.ok(calls)
    assert.equal(state.loading, false)
    assert.equal(notices.length, 1)
    assert.equal(state.modules.length, 1)
    assert.equal(state.themes.length, 1)
    assert.equal(state.locked.client, true)
  })
}
test('locale responses cannot replace the selected language with stale data', async () => {
  const pending = new Map()
  const state = { code: 'ru', messagesRequest: 0, $api: { get: (url) => new Promise((resolve) => pending.set(url, resolve)) } }
  const load = method('locales.vue', 'loadMessages')
  const ru = load.call(state)
  state.code = 'en'
  const en = load.call(state)
  pending.get('/locales/en/messages')({ data: { hello: 'Hello' } })
  await en
  pending.get('/locales/ru/messages')({ data: { hello: 'Привет' } })
  await ru
  assert.equal(state.messages.hello, 'Hello')
  assert.equal(state.loading, false)
})
test('server editing sends explicitly cleared text fields', async () => {
  let payload
  const lodash = require('lodash')
  const state = {
    server: {
      id: 'qa',
      name: 'QA',
      version: '1.21',
      slogan: '',
      description: '',
      content: '',
      query: { host: '127.0.0.1', port: 25566 },
      delivery_mode: 0,
      wipe: false,
      table: [],
      mods: [],
    },
    instancesIncomplete: () => false,
    instancesPayload: () => [],
    translations: { save: async () => {} },
    load: async () => {},
    $_: lodash,
    $t: (key) => key,
    $toast: { add: () => {} },
    $api: {
      patch: async (url, data) => {
        payload = data
      },
    },
  }
  await method('servers.vue', 'updateServer').call(state)
  assert.ok(payload)
  assert.equal(payload.slogan, '')
  assert.equal(payload.description, '')
  assert.equal(payload.content, '')
  assert.equal(payload.id, undefined)
})
test('failed translation deletion reports failure even when refresh succeeds', async () => {
  const notices = []
  let accept
  let refreshed = false
  const state = {
    $confirm: {
      require: (options) => {
        accept = options.accept
      },
    },
    loading: false,
    $t: (key) => key,
    $toast: { add: (n) => notices.push(n) },
    $api: {
      delete: async () => {
        throw { response: { status: 409 } }
      },
    },
    load: async () => {
      refreshed = true
    },
  }
  method('locales.vue', 'removeKey').call(state, 'qa.key')
  await accept()
  assert.equal(refreshed, true)
  assert.equal(notices.length, 1)
  assert.equal(notices[0].severity, 'error')
})
test('a saved bonus closes its form even when refreshing the list fails', async () => {
  const notices = []
  const state = {
    bonusDialog: true,
    bonus: { amount: 200, bonus: 10 },
    $t: (key) => key,
    toast: { add: (n) => notices.push(n) },
    $toast: { add: (n) => notices.push(n) },
    $api: {
      post: async () => ({ data: { id: 99 } }),
      get: async () => {
        throw Error('Network Error')
      },
    },
  }
  state.load = method('payment.vue', 'load').bind(state)
  await method('payment.vue', 'createBonus').call(state)
  assert.equal(state.bonusDialog, false)
  assert.equal(state.loading, false)
  assert.equal(notices.filter((n) => n.severity === 'success').length, 1)
  assert.equal(notices.filter((n) => n.severity === 'error').length, 1)
})

for (const [name, flag] of [
  ['moneyFetch', 'money_loading'],
  ['udgFetch', 'udg_loading'],
  ['udpFetch', 'udp_loading'],
  ['updateMoney', 'money_loading'],
  ['updateReal', null],
  ['updateVirtual', null],
]) {
  test(`user.${name}: failed request is reported without a stuck loader`, async () => {
    const notices = []
    const state = {
      user: { uuid: 'qa', real: 10, virtual: 20 },
      money: [{ server: { id: 'qa' }, money: 30 }],
      udg: [{ id: 1 }],
      udp: [{ id: 2 }],
      $t: (key) => key,
      $toast: { add: (n) => notices.push(n) },
      $api: {
        get: async () => {
          throw Error('Network Error')
        },
        patch: async () => {
          throw Error('Network Error')
        },
      },
    }
    await assert.doesNotReject(method('users/[uuid].vue', name).call(state, 'qa'))
    assert.equal(notices.length, 1)
    if (flag) assert.equal(state[flag], false)
    assert.equal(state.money.length, 1)
    assert.equal(state.udg.length, 1)
    assert.equal(state.udp.length, 1)
  })
}

test('warehouse switches ignore older responses and report failed refresh', async () => {
  const pending = []
  const notices = []
  const state = {
    warehouse_request: 0,
    warehouse_server: { id: 'first' },
    user: { uuid: 'qa' },
    warehouse: [],
    $t: (key) => key,
    $toast: { add: (n) => notices.push(n) },
    $api: { get: () => new Promise((resolve, reject) => pending.push({ resolve, reject })) },
  }
  const fetch = method('users/[uuid].vue', 'warehouseFetch').bind(state)
  const first = fetch()
  state.warehouse_server = { id: 'second' }
  const second = fetch()
  pending[1].resolve({ data: [{ id: 'second' }] })
  await second
  pending[0].resolve({ data: [{ id: 'first' }] })
  await first
  assert.equal(state.warehouse[0].id, 'second')
  const failed = fetch()
  pending[2].reject(Error('Network Error'))
  await failed
  assert.equal(notices.length, 1)
  assert.equal(state.wh_loading, false)
  assert.equal(state.warehouse[0].id, 'second')
})
