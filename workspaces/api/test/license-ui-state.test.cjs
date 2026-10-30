const assert = require('node:assert/strict')
const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { runInNewContext } = require('node:vm')
const ts = require('typescript')

test('browser state reloads once per denial and resets after a restored license', async () => {
  const storage = new Map(),
    key = 'unicore-license-ui-state'
  let check,
    ready,
    reloads = 0,
    state = { themeAllowed: true, blockedModules: [] }
  storage.set(key, '{"themeAllowed":false,"blockedModules":[]}')
  const context = {
    exports: {},
    defineNuxtPlugin: (callback) => callback(),
    useRuntimeConfig: () => ({ public: { licensedFrontend: true } }),
    $fetch: async () => state,
    onNuxtReady: (callback) => {
      ready = callback
    },
    setInterval: (callback) => {
      check = callback
      return 1
    },
    clearInterval() {},
    window: {
      location: {
        reload: () => {
          reloads++
        },
      },
      addEventListener() {},
    },
    sessionStorage: {
      getItem: (value) => storage.get(value),
      setItem: (name, value) => storage.set(name, value),
      removeItem: (value) => storage.delete(value),
    },
  }
  const source = readFileSync(resolve(__dirname, '../../ui/plugins/license-state.client.ts'), 'utf8')
  runInNewContext(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    context,
  )
  ready()
  await check()
  assert.equal(storage.has(key), false)
  state = { themeAllowed: false, blockedModules: [] }
  await check()
  await check()
  assert.equal(reloads, 1)
  state = { themeAllowed: true, blockedModules: [] }
  await check()
  state = { themeAllowed: false, blockedModules: [] }
  await check()
  assert.equal(reloads, 2)
})
