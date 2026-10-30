const assert = require('node:assert/strict')
const { test } = require('node:test')
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { resolveLayers, guardLayers } = require('../dist/nuxt/index.js')

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'unicore-layer-admission-'))
  const add = (id, requires, extra = {}) => {
    mkdirSync(join(root, 'modules', id, 'client'), { recursive: true })
    writeFileSync(
      join(root, 'modules', id, 'module.json'),
      JSON.stringify({
        id,
        name: id,
        version: '1.0.0',
        unicoreApi: '*',
        client: './client',
        ...(requires ? { requires: { modules: requires } } : {}),
        ...extra,
      }),
    )
  }
  return { root, add, resolve: () => resolveLayers({ root, side: 'client' }), close: () => rmSync(root, { recursive: true, force: true }) }
}

test('Nuxt admission rejects transitive consumers of unlicensed, disabled, missing and incompatible modules', () => {
  const f = fixture()
  try {
    f.add('style')
    f.add('consumer', { style: '*' })
    f.add('disabled')
    f.add('disabled_consumer', { disabled: '*' })
    f.add('missing_consumer', { missing: '*' })
    f.add('version_consumer', { ordinary: '^2' })
    f.add('ordinary')
    writeFileSync(join(f.root, 'modules/state.json'), JSON.stringify({ disabled: { enabled: false } }))
    const result = f.resolve()
    assert.deepEqual(result.enabledIds, ['ordinary'])
    assert.equal(result.problems.length, 5)
  } finally {
    f.close()
  }
})

test('Nuxt admission rejects dependency cycles and orders server-only dependencies without adding a layer', () => {
  const f = fixture()
  try {
    f.add('cycle_a', { cycle_b: '*' })
    f.add('cycle_b', { cycle_a: '*' })
    f.add('server_only', null, { client: undefined })
    f.add('ordinary', { server_only: '*' })
    assert.deepEqual(f.resolve().enabledIds, ['ordinary'])
    assert.equal(f.resolve().problems.length, 2)
  } finally {
    f.close()
  }
})

test('Nuxt route ownership resolves relative children before checking the module namespace', () => {
  const f = fixture()
  try {
    f.add('ordinary')
    const callbacks = new Map()
    guardLayers({ options: { ssr: true }, hook: (name, callback) => callbacks.set(name, callback) }, f.root)
    const pages = [
      { path: '/mod/ordinary', children: [{ path: 'settings', file: join(f.root, 'modules/ordinary/client/pages/settings.vue') }] },
    ]
    assert.doesNotThrow(() => callbacks.get('pages:extend')(pages))
    assert.doesNotThrow(() => callbacks.get('pages:resolved')(pages))
    pages[0].children[0].path = '../../escape'
    assert.throws(() => callbacks.get('pages:resolved')(pages), /должна начинаться/)
  } finally {
    f.close()
  }
})
