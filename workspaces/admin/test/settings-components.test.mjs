import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import { test } from 'node:test'
const require = createRequire(new URL('../package.json', import.meta.url))
const { parse, compileScript } = require('vue/compiler-sfc')
const { transformSync } = createRequire(new URL('../../server/package.json', import.meta.url))('esbuild')
const vue = require('vue')
function component(file, globals = {}) {
  const { descriptor } = parse(readFileSync(new URL('../components/' + file, import.meta.url), 'utf8'))
  const source = descriptor.scriptSetup ? compileScript(descriptor, { id: 'test' }).content : descriptor.script.content
  const code = transformSync(source, { loader: 'ts', format: 'cjs' }).code
  const module = { exports: {} }
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (id) =>
      id === 'vue'
        ? vue
        : id === 'unicore-api'
          ? { settingIssue: () => null }
          : id === '@primevue/core/api'
            ? { FilterMatchMode: { CONTAINS: 'contains' } }
            : {},
    ...vue,
    ...globals,
  })
  return module.exports.default
}

const advanced = component('AdvancedSettings.vue')
test('failed load resets spinner and exposes retry error', async () => {
  const state = {
    ...advanced.data(),
    $api: {
      get: async () => {
        throw Error('offline')
      },
    },
  }
  await advanced.methods.load.call(state)
  assert.equal(state.loading, false)
  assert.equal(state.loadError, true)
})
test('late image upload never overwrites a newer manual value', async () => {
  let resolve
  const promise = new Promise((r) => (resolve = r))
  const callbacks = []
  const emitted = []
  const props = vue.reactive({ modelValue: 'old', field: { key: 'logo' } })
  const field = component('SettingField.vue', {
    useNuxtApp: () => ({ $t: (k) => k, $uploadImage: () => promise }),
    useId: () => 'test',
    onBeforeUnmount: (fn) => callbacks.push(fn),
  })
  const setup = field.setup(props, { expose: () => {}, emit: (...args) => emitted.push(args) })
  const pending = setup.upload({ target: { files: [{}], value: 'file' } })
  props.modelValue = 'new'
  await vue.nextTick()
  resolve('/late.png')
  await pending
  assert.equal(emitted.filter((e) => e[0] === 'update:modelValue').length, 0)
})

test('failed reload after successful save does not report failed save', async () => {
  const notices = []
  const state = {
    ...advanced.data(),
    $api: {
      post: async () => {},
      get: async () => {
        throw Error('offline')
      },
    },
    $t: (key) => key,
    $toast: { add: (notice) => notices.push(notice) },
  }
  state.load = advanced.methods.load.bind(state)
  await advanced.methods.createCfg.call(state)
  assert.equal(state.loading, false)
  assert.equal(state.loadError, true)
  assert.deepEqual(
    notices.map((notice) => notice.severity),
    ['success'],
  )
})

test('failed deletion reports an error and releases loading state', async () => {
  let confirm
  const notices = []
  const state = {
    ...advanced.data(),
    $api: {
      delete: async () => {
        throw Error('offline')
      },
    },
    $t: (key) => key,
    $confirm: {
      require: (options) => {
        confirm = options
      },
    },
    $toast: { add: (notice) => notices.push(notice) },
    load: async () => {},
  }
  await advanced.methods.removeCfg.call(state, 'example')
  await confirm.accept()
  assert.equal(state.loading, false)
  assert.deepEqual(
    notices.map((notice) => notice.severity),
    ['error'],
  )
})

for (const unmount of [false, true]) {
  test(`image upload ${unmount ? 'is ignored after unmount' : 'sets the value on completion'}`, async () => {
    let resolve
    const promise = new Promise((r) => {
      resolve = r
    })
    let dispose
    const emitted = []
    const props = vue.reactive({ modelValue: 'old', field: { key: 'logo' } })
    const field = component('SettingField.vue', {
      useNuxtApp: () => ({ $t: (key) => key, $uploadImage: () => promise }),
      useId: () => 'test',
      onBeforeUnmount: (fn) => {
        dispose = fn
      },
    })
    const setup = field.setup(props, { expose: () => {}, emit: (...args) => emitted.push(args) })
    const pending = setup.upload({ target: { files: [{}], value: 'file' } })
    if (unmount) dispose()
    resolve('/uploaded.png')
    await pending
    assert.equal(emitted.filter((event) => event[0] === 'update:modelValue').length, unmount ? 0 : 1)
    assert.deepEqual(emitted.at(-1), ['uploading', false])
  })
}
