const assert = require('node:assert/strict')
const { test } = require('node:test')
require('reflect-metadata')
const { LicensedModule } = require('../dist/server/index.js')

test('licensed classes skip denied startup, reject business effects and always finish teardown', () => {
  const key = Symbol.for('unicore.license.active-host.v1'),
    previous = globalThis[key]
  let allowed = false,
    initialized = 0,
    effects = 0,
    cleaned = 0
  globalThis[key] = {
    assert() {
      if (!allowed) throw Error('runtime_denied')
    },
  }
  class Service {
    onModuleInit() {
      initialized++
    }
    onApplicationBootstrap() {
      initialized++
    }
    effect() {
      effects++
    }
    onModuleDestroy() {
      cleaned++
    }
    beforeApplicationShutdown() {
      cleaned++
    }
    onApplicationShutdown() {
      cleaned++
    }
  }
  try {
    LicensedModule('style')(Service)
    const service = new Service()
    service.onModuleInit()
    service.onApplicationBootstrap()
    assert.equal(initialized, 0)
    assert.throws(() => service.effect(), /runtime_denied/)
    allowed = true
    service.onModuleInit()
    service.effect()
    allowed = false
    service.onModuleDestroy()
    service.beforeApplicationShutdown()
    service.onApplicationShutdown()
    assert.equal(initialized, 1)
    assert.equal(effects, 1)
    assert.equal(cleaned, 3)
  } finally {
    globalThis[key] = previous
  }
})
