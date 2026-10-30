const client = require('./sdk.cjs')

class RuntimeController {
  constructor(options) {
    this.options = options
    this.runtime = client.newRuntime()
    this.timer = null
    this.expiry = null
    this.closed = false
    this.busy = false
    this.blocked = false
    this.starting = false
    this.queue = Promise.resolve()
    this.lastEnvelope = null
  }
  request(operation, extraPayload = {}) {
    const task = async () => {
      const result = await client.licensingRequest({
        ...this.options,
        payload: { ...this.options.payload, ...extraPayload },
        operation,
        runtime: this.runtime,
      })
      if (result.denied) {
        this.block(result.result.reason)
        throw new client.LicenseError(result.result.reason)
      }
      if (result.result.type === 'runtime') this.lastEnvelope = result.envelope
      return result
    }
    const pending = this.queue.then(task, task)
    this.queue = pending.catch(() => {})
    return pending
  }
  async start() {
    client.requireCondition(!this.closed && !this.timer && !this.starting, 'runtime_already_started')
    this.starting = true
    try {
      await this.request('start')
      client.requireCondition(!this.closed, 'runtime_closed')
      this.schedule()
      this.timer = setInterval(() => {
        this.refresh().catch(() => {})
      }, 60000)
      this.timer.unref()
      return this
    } finally {
      this.starting = false
    }
  }
  schedule() {
    clearTimeout(this.expiry)
    this.expiry = setTimeout(() => this.block('runtime_expired'), client.runtimeRemaining(this.runtime))
    this.expiry.unref()
  }
  async refresh(forceOnline = false) {
    if (this.closed || this.blocked) return
    while (this.busy && this.pendingRefresh) {
      try {
        await this.pendingRefresh
      } catch (error) {
        if (!forceOnline) throw error
      }
      if (!forceOnline) return
    }
    if (this.closed || this.blocked || (this.busy && !forceOnline)) return
    this.busy = true
    const pending = (async () => {
      const result = await this.request('heartbeat')
      if (!this.closed && !this.blocked) this.schedule()
      return result
    })()
    this.pendingRefresh = pending
    try {
      return await pending
    } finally {
      if (this.pendingRefresh === pending) {
        this.pendingRefresh = null
        this.busy = false
      }
    }
  }
  assert(lease, now = Date.now()) {
    client.requireCondition(!this.closed && !this.blocked, 'runtime_denied')
    try {
      return client.requireRuntime(this.runtime, lease, this.options.issuerKeys, now)
    } catch (error) {
      this.block(error.code || 'runtime_denied')
      throw error
    }
  }
  block(reason) {
    if (this.blocked || this.closed) return
    this.blocked = true
    clearInterval(this.timer)
    clearTimeout(this.expiry)
    try {
      Promise.resolve(this.options.onBlocked?.(reason)).catch((error) => this.report(error))
    } catch (error) {
      this.report(error)
    }
  }
  report(error) {
    try {
      Promise.resolve(this.options.onError?.(error)).catch(() => {})
    } catch {}
  }
  async stop() {
    this.closed = true
    clearInterval(this.timer)
    clearTimeout(this.expiry)
    client.closeRuntime(this.runtime)
    return this.request('stop')
  }
}

module.exports = { RuntimeController }
