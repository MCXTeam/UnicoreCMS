const assert = require('node:assert/strict')
const { test, afterEach } = require('node:test')
const { pathToFileURL } = require('node:url')
const path = require('node:path')
const api = require('../dist/admin/index.js')

afterEach(() => api.setActiveModules(null))

function form(id = null) {
  const record = { id, mode: id == null ? 'create' : 'edit', value: { name: 'Ticket' } }
  return { record, controller: api.createAdminForm('store.product', () => record) }
}

test('контекст изолирован на открытие, обработчики ждут async load и получают ID после создания', async () => {
  const { record, controller } = form()
  const order = []
  controller.context.register('ticket', {
    async load(current) { await Promise.resolve(); order.push(`load:${current.mode}`) },
    validate() { order.push('validate') },
    save(current) { order.push(`save:${current.id}:${current.mode}`) },
    reset() { order.push('reset') },
  })
  await controller.load()
  await controller.validate()
  record.id = 42
  record.mode = 'edit'
  await controller.save()
  controller.dispose()
  controller.dispose()
  assert.deepEqual(order, ['load:create', 'validate', 'save:42:edit', 'reset'])
  assert.equal(controller.context.signal.aborted, true)
  const other = form(7)
  await other.controller.validate()
  await other.controller.save()
  assert.equal(other.controller.context.record.id, 7)
})

test('отказ загрузки повторяет только незагруженный модуль и блокирует validate', async () => {
  const { controller } = form(1)
  let loaded = 0, attempt = 0, validated = 0
  controller.context.register('first', { load() { loaded++ } })
  controller.context.register('second', {
    load() { if (++attempt === 1) throw new Error('offline') },
    validate() { validated++ },
  })
  await assert.rejects(controller.validate(), (error) => error instanceof api.AdminFormError && error.moduleId === 'second' && error.phase === 'load')
  assert.equal(validated, 0)
  await controller.validate()
  assert.equal(loaded, 1)
  assert.equal(attempt, 2)
  assert.equal(validated, 1)
})

test('ошибка validate и save сохраняет причину и не запускает следующие обработчики', async () => {
  const { controller } = form(1)
  let calls = 0
  const reason = new Error('invalid permission')
  controller.context.register('first', { validate() { throw reason }, save() { throw reason } })
  controller.context.register('second', { validate() { calls++ }, save() { calls++ } })
  for (const phase of ['validate', 'save']) {
    await assert.rejects(controller[phase](), (error) => error instanceof api.AdminFormError && error.phase === phase && error.cause === reason)
  }
  assert.equal(calls, 0)
})

test('отмена во время загрузки отменяет signal и не продолжает цепочку после запоздалого ответа', async () => {
  const { controller } = form(1)
  let release, calls = 0
  controller.context.register('first', { load() { return new Promise((resolve) => { release = resolve }) } })
  controller.context.register('second', { load() { calls++ }, validate() { calls++ }, save() { calls++ } })
  const pending = controller.load()
  controller.dispose()
  release()
  await pending
  await controller.validate()
  await controller.save()
  assert.equal(calls, 0)
})

test('выключенный модуль не участвует, старый disposer не удаляет новую регистрацию', async () => {
  const { controller } = form(1)
  let calls = 0
  const old = controller.context.register('ticket', { save() { calls += 100 } })
  old()
  controller.context.register('ticket', { save() { calls++ } })
  old()
  api.setActiveModules([])
  await controller.save()
  assert.equal(calls, 0)
  api.setActiveModules(['ticket'])
  await controller.save()
  assert.equal(calls, 1)
  assert.throws(() => controller.context.register('ticket', {}), /уже зарегистрирован/)
})

test('нельзя сохранить настройки расширения до создания основной записи', async () => {
  const { controller } = form()
  let calls = 0
  controller.context.register('ticket', { save() { calls++ } })
  await assert.rejects(controller.save(), (error) => error.phase === 'save')
  assert.equal(calls, 0)
})

test('сбой reset одного модуля не мешает очистке остальных', () => {
  const { controller } = form()
  let reset = false
  controller.context.register('first', { reset() { reset = true } })
  controller.context.register('broken', { reset() { throw new Error('reset failed') } })
  const original = console.warn
  console.warn = () => undefined
  try { controller.dispose() } finally { console.warn = original }
  assert.equal(reset, true)
})

test('CJS и ESM разделяют активность модулей и сохраняют старые слоты', async () => {
  const esm = await import(pathToFileURL(path.resolve(__dirname, '../dist/admin/index.mjs')).href)
  assert.ok(api.ADMIN_SLOTS.includes('dashboard'))
  assert.ok(api.ADMIN_SLOTS.includes('users.profile'))
  assert.ok(api.ADMIN_SLOTS.includes('store.product.form'))
  api.setActiveModules(['ticket'])
  assert.equal(esm.moduleActive('other'), false)
  assert.equal(esm.moduleActive('ticket'), true)
})
