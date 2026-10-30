const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const http = require('node:http')
const { parseEnv } = require('node:util')
const client = require('./sdk.cjs')
const { RuntimeController } = require('./runtime-controller.cjs')

const idPattern = /^[a-z][a-z0-9_]{2,31}$/
const productKey = (kind, id) => `${kind}:${id}`
const codeOf = (error) => (error instanceof client.LicenseError ? error.code : 'license_service_unavailable')
function json(filename, fallback) {
  if (!fs.existsSync(filename)) return fallback
  client.requireCondition(!fs.lstatSync(filename).isSymbolicLink(), 'private_state_symlink')
  client.requireCondition(fs.statSync(filename).size < 2 * 1024 * 1024, 'private_state_too_large')
  return JSON.parse(fs.readFileSync(filename, 'utf8'))
}

class Coordinator {
  constructor({ root, trust = require('./trust.cjs') }) {
    this.root = path.resolve(root)
    this.trust = trust
    this.directory = path.join(this.root, '.unicore/licensing')
    this.stateFile = path.join(this.directory, 'installation.json')
    this.state = json(this.stateFile, null) || { installation: client.newInstallation(), licenses: {} }
    this.entries = new Map()
    this.controllers = new Map()
    this.peers = new Map()
    this.queue = Promise.resolve()
    this.token = crypto.randomBytes(32).toString('base64url')
    this.admissionToken = crypto.randomBytes(32).toString('base64url')
    this.closed = false
  }
  persist() {
    client.saveState(this.stateFile, this.state)
  }
  configured() {
    return Boolean(this.trust.server && Object.keys(this.trust.issuerKeys).length && Object.keys(this.trust.publisherKeys).length)
  }
  environment() {
    const filename = path.join(this.root, '.env')
    return fs.existsSync(filename) && fs.statSync(filename).size < 2 * 1024 * 1024 ? parseEnv(fs.readFileSync(filename, 'utf8')) : {}
  }
  origin() {
    const config = json(path.join(this.directory, 'config.json'), {})
    const environment = this.environment()
    return client.normalizeOrigin(config.origin || environment.BASEURL || process.env.BASEURL, this.trust.allowLocal)
  }
  catalogProduct(kind, id) {
    return this.trust.catalog[productKey(kind, id)] || null
  }
  scan() {
    const result = new Map()
    const modules = json(path.join(this.root, 'modules/state.json'), {})
    const themes = json(path.join(this.root, 'themes/state.json'), {})
    const environment = this.environment()
    const selectedThemes = new Set(
      [
        (process.env.UNICORE_THEME ?? environment.UNICORE_THEME) || themes.client || themes.active,
        (process.env.UNICORE_ADMIN_THEME ?? environment.UNICORE_ADMIN_THEME) || themes.admin,
      ].filter(Boolean),
    )
    for (const [kind, folder] of [
      ['module', 'modules'],
      ['theme', 'themes'],
    ]) {
      const base = path.join(this.root, folder)
      if (!fs.existsSync(base)) continue
      for (const name of fs.readdirSync(base, { withFileTypes: true })) {
        if (!name.isDirectory() || name.name.startsWith('.') || name.name === 'node_modules') continue
        const directory = path.join(base, name.name)
        let manifest
        try {
          manifest = json(path.join(directory, `${kind}.json`), null)
        } catch {
          continue
        }
        if (!manifest || !idPattern.test(manifest.id)) continue
        const productId = this.catalogProduct(kind, manifest.id)
        if (!productId && !manifest.commercial && !fs.existsSync(path.join(directory, client.ARTIFACT_FILE))) continue
        const key = productKey(kind, manifest.id)
        client.requireCondition(!result.has(key), 'duplicate_extension_id')
        result.set(key, {
          key,
          id: manifest.id,
          kind,
          productId,
          directory,
          manifest,
          selected: kind === 'module' ? modules[manifest.id]?.enabled !== false : selectedThemes.has(manifest.id),
        })
      }
    }
    return result
  }
  stateFor(key, releaseId) {
    const stored = this.state.licenses[key]
    if (!stored) return null
    return { ...stored, ...this.state.installation, lease: stored.receipts?.[releaseId] || stored.lease }
  }
  cache(key, envelope, expected) {
    const previous = this.state.licenses[key] || this.state.installation
    const next = client.cacheResponse({ ...previous, ...this.state.installation }, envelope, this.trust.issuerKeys, expected)
    const { privateKey, publicKey, installationId, ...stored } = next
    stored.receipts = { ...(previous.receipts || {}), ...(next.lease ? { [next.lease.payload.releaseId]: next.lease } : {}) }
    this.state.licenses[key] = stored
    this.persist()
    return this.stateFor(key, envelope.payload.releaseId)
  }
  verify(entry) {
    client.requireCondition(this.configured(), 'licensing_not_configured')
    client.requireCondition(entry.productId, 'unknown_commercial_product')
    return client.verifyArtifact(entry.directory, this.trust.publisherKeys, {
      productId: entry.productId,
      kind: entry.kind,
      extensionId: entry.id,
    })
  }
  async startEntry(entry, forceOnline) {
    try {
      const checked = this.verify(entry)
      entry.releaseId = checked.artifact.releaseId
      entry.artifactDigest = checked.artifactDigest
      let state = this.stateFor(entry.key, checked.artifact.releaseId)
      client.requireCondition(state?.lease, 'activation_required')
      const binding = {
        productId: entry.productId,
        kind: entry.kind,
        releaseId: checked.artifact.releaseId,
        artifactDigest: checked.artifactDigest,
        installationId: this.state.installation.installationId,
        keyFingerprint: client.keyFingerprint(this.state.installation.publicKey),
        origin: this.origin(),
      }
      const receipt = client.verifyEnvelope(state.lease, this.trust.issuerKeys, client.domains.license)
      let lease = client.verifyLease(state.lease, this.trust.issuerKeys, binding, Math.min(Date.now(), receipt.issuedAt))
      let current = this.controllers.get(entry.key)
      if (current && current.releaseId !== checked.artifact.releaseId) {
        await current.controller.stop().catch(() => {})
        this.controllers.delete(entry.key)
        current = null
      }
      if (forceOnline) {
        try {
          const renewed = await client.licensingRequest({
            server: this.trust.server,
            allowLocal: this.trust.allowLocal,
            operation: 'lease',
            installation: this.state.installation,
            issuerKeys: this.trust.issuerKeys,
            payload: { activationId: state.activationId, releaseId: checked.artifact.releaseId, origin: this.origin() },
          })
          state = this.cache(entry.key, renewed.envelope, { productId: entry.productId, kind: entry.kind, origin: this.origin() })
          if (renewed.denied) current?.controller.block(renewed.result.reason)
          client.requireCondition(!renewed.denied, renewed.result.reason || 'license_denied')
          lease = client.verifyLease(state.lease, this.trust.issuerKeys, binding)
        } catch (error) {
          if (!current) throw error
          current.controller.assert(lease)
          entry.startupReason = codeOf(error)
        }
      }
      if (!current || current.controller.blocked || current.controller.closed) {
        if (current) await current.controller.stop().catch(() => {})
        const controller = new RuntimeController({
          server: this.trust.server,
          allowLocal: this.trust.allowLocal,
          installation: this.state.installation,
          issuerKeys: this.trust.issuerKeys,
          productId: entry.productId,
          kind: entry.kind,
          payload: { activationId: state.activationId, releaseId: checked.artifact.releaseId, origin: this.origin() },
          onBlocked: (reason) => {
            entry.allowed = false
            entry.reason = reason
          },
        })
        await controller.start()
        current = { controller, releaseId: checked.artifact.releaseId, lease }
        this.controllers.set(entry.key, current)
      } else if (forceOnline) {
        try {
          await current.controller.refresh(true)
        } catch (error) {
          current.controller.assert(lease)
          entry.startupReason = codeOf(error)
        }
      }
      current.controller.assert(lease)
      current.lease = lease
      Object.assign(entry, {
        allowed: true,
        reason: null,
        releaseId: checked.artifact.releaseId,
        artifactDigest: checked.artifactDigest,
        lease,
      })
    } catch (error) {
      entry.allowed = false
      entry.reason = codeOf(error)
    }
  }
  async synchronize(forceOnline) {
    const entries = this.scan()
    for (const key of this.entries.keys())
      if (!entries.has(key) || !entries.get(key).selected) {
        await this.controllers
          .get(key)
          ?.controller.stop()
          .catch(() => {})
        this.controllers.delete(key)
      }
    for (const entry of entries.values()) if (entry.selected) await this.startEntry(entry, forceOnline)
    this.entries = entries
  }
  snapshot(startup = false, permits) {
    const entries = []
    for (const entry of this.entries.values()) {
      const current = this.controllers.get(entry.key)
      if (entry.allowed && current)
        try {
          current.controller.assert(current.lease)
        } catch (error) {
          entry.allowed = false
          entry.reason = codeOf(error)
        }
      const remaining = entry.allowed && current ? client.runtimeRemaining(current.controller.runtime) : 0
      entries.push({
        key: entry.key,
        id: entry.id,
        kind: entry.kind,
        productId: entry.productId,
        selected: entry.selected,
        activated: Boolean(this.state.licenses[entry.key]?.activationId),
        allowed: Boolean(entry.allowed && remaining > 0 && !(startup && entry.startupReason)),
        reason: (startup && entry.startupReason) || entry.reason || (entry.selected ? 'activation_required' : 'not_selected'),
        releaseId: entry.releaseId || null,
        artifactDigest: entry.artifactDigest || null,
        remaining: Math.max(0, Math.floor(remaining)),
        expiresAt: Date.now() + Math.max(0, Math.floor(remaining)),
        permit: permits?.get(entry.key) || current?.controller.lastEnvelope || null,
      })
    }
    return { configured: this.configured(), entries }
  }
  async activate(input) {
    client.requireCondition(this.configured(), 'licensing_not_configured')
    client.requireCondition(['module', 'theme'].includes(input.kind) && idPattern.test(input.id), 'invalid_extension')
    const key = productKey(input.kind, input.id)
    const pinned = this.trust.catalog[key]
    client.requireCondition(pinned, 'unknown_commercial_product')
    const productId = pinned
    client.requireCondition(typeof productId === 'string' && /^[a-z][a-z0-9._-]{2,100}$/.test(productId), 'invalid_product')
    if (pinned && input.productId) client.requireCondition(pinned === input.productId, 'license_binding_mismatch')
    const result = await client.licensingRequest({
      server: this.trust.server,
      allowLocal: this.trust.allowLocal,
      operation: 'activate',
      installation: this.state.installation,
      issuerKeys: this.trust.issuerKeys,
      payload: {
        ...(input.transferCode ? { transferCode: input.transferCode } : { licenseKey: input.licenseKey }),
        publicKey: this.state.installation.publicKey,
        releaseId: input.releaseId,
        origin: this.origin(),
      },
    })
    client.requireCondition(!result.denied, result.result.reason || 'activation_denied')
    client.requireCondition(result.result.productId === productId && result.result.kind === input.kind, 'license_binding_mismatch')
    this.cache(key, result.envelope, { productId, kind: input.kind, origin: this.origin() })
    await this.synchronize(true)
    return { ...this.snapshot(), replacementKey: result.result.licenseKey || null }
  }
  async verifyInstall(input) {
    client.requireCondition(['module', 'theme'].includes(input.kind) && idPattern.test(input.id), 'invalid_extension')
    const expectedBase = path.join(this.root, input.kind === 'module' ? 'modules' : 'themes')
    const directory = path.resolve(input.directory)
    client.requireCondition(directory.startsWith(expectedBase + path.sep), 'invalid_install_directory')
    const manifest = json(path.join(directory, `${input.kind}.json`), null)
    const productId = this.catalogProduct(input.kind, input.id)
    if (!productId) {
      client.requireCondition(
        !manifest?.commercial && !fs.existsSync(path.join(directory, client.ARTIFACT_FILE)),
        'unknown_commercial_product',
      )
      return { allowed: true, commercial: false }
    }
    const key = productKey(input.kind, input.id)
    const checked = this.verify({ kind: input.kind, id: input.id, productId, directory })
    const state = this.stateFor(key, checked.artifact.releaseId)
    client.requireCondition(state?.activationId, 'activation_required')
    const result = await client.licensingRequest({
      server: this.trust.server,
      allowLocal: this.trust.allowLocal,
      operation: 'lease',
      installation: this.state.installation,
      issuerKeys: this.trust.issuerKeys,
      payload: { activationId: state.activationId, releaseId: checked.artifact.releaseId, origin: this.origin() },
    })
    this.cache(key, result.envelope, { productId, kind: input.kind, origin: this.origin() })
    client.requireCondition(!result.denied, result.result.reason || 'license_denied')
    client.requireCondition(result.result.artifactDigest === checked.artifactDigest, 'artifact_binding_mismatch')
    return { allowed: true, commercial: true }
  }
  async transfer(input) {
    const key = productKey(input.kind, input.id)
    const state = this.state.licenses[key]
    client.requireCondition(state?.activationId, 'activation_required')
    const result = await client.licensingRequest({
      server: this.trust.server,
      allowLocal: this.trust.allowLocal,
      operation: 'transfer',
      installation: this.state.installation,
      issuerKeys: this.trust.issuerKeys,
      payload: { activationId: state.activationId, origin: this.origin(), targetOrigin: input.targetOrigin },
    })
    client.requireCondition(!result.denied, result.result.reason || 'transfer_denied')
    this.controllers.get(key)?.controller.block('activation_inactive')
    state.transferred = true
    this.persist()
    const entry = this.entries.get(key)
    if (entry) {
      entry.allowed = false
      entry.reason = 'activation_inactive'
    }
    return { transferCode: result.result.transferCode, readyAt: result.result.readyAt, expiresAt: result.result.expiresAt }
  }
  async perform(input) {
    client.requireCondition(input && typeof input === 'object', 'invalid_request')
    if (input.action === 'status' || input.action === 'check') {
      if (input.peerId) this.peers.set(input.peerId, Date.now())
      const state = this.snapshot()
      if (input.action === 'check')
        client.requireCondition(
          state.entries.some((entry) => entry.key === productKey(input.kind, input.id) && entry.allowed),
          'license_denied',
        )
      return state
    }
    if (input.action === 'attach') {
      client.requireCondition(
        typeof input.peerId === 'string' &&
          input.peerId.length < 100 &&
          typeof input.peerNonce === 'string' &&
          /^[A-Za-z0-9_-]{43}$/.test(input.peerNonce),
        'invalid_peer',
      )
      await this.synchronize(true)
      const permits = new Map()
      for (const entry of this.entries.values())
        if (entry.allowed && !entry.startupReason) {
          const controller = this.controllers.get(entry.key)?.controller
          try {
            const result = await controller.request('heartbeat', {
              peerNonce: input.peerNonce,
              ...(input.recipientPublicKey ? { recipientPublicKey: input.recipientPublicKey } : {}),
            })
            controller.schedule()
            permits.set(entry.key, result.envelope)
          } catch (error) {
            entry.startupReason = codeOf(error)
          }
        }
      this.peers.set(input.peerId, Date.now())
      return this.snapshot(true, permits)
    }
    if (input.action === 'refresh') {
      await this.synchronize(true)
      return this.snapshot()
    }
    if (input.action === 'activate') return this.activate(input)
    if (input.action === 'install') return this.verifyInstall(input)
    if (input.action === 'transfer') return this.transfer(input)
    throw new client.LicenseError('invalid_operation')
  }
  async listen() {
    fs.mkdirSync(this.directory, { recursive: true, mode: 0o700 })
    this.persist()
    const handler = async (request, response) => {
      response.setHeader('content-type', 'application/json')
      response.setHeader('cache-control', 'no-store')
      const expected = Buffer.from(`Bearer ${this.token}`),
        admission = Buffer.from(`Bearer ${this.admissionToken}`),
        actual = Buffer.from(String(request.headers.authorization || ''))
      const management = actual.length === expected.length && crypto.timingSafeEqual(expected, actual)
      const readOnly = actual.length === admission.length && crypto.timingSafeEqual(admission, actual)
      if (request.headers.origin || request.method !== 'POST' || request.url !== '/' || (!management && !readOnly)) {
        response.writeHead(403)
        response.end('{"error":"forbidden"}')
        return
      }
      try {
        const parts = []
        let size = 0
        for await (const part of request) {
          size += part.length
          client.requireCondition(size <= 16384, 'request_too_large')
          parts.push(part)
        }
        const input = JSON.parse(Buffer.concat(parts).toString('utf8'))
        client.requireCondition(management || ['status', 'check', 'attach'].includes(input.action), 'coordinator_read_only')
        const perform = () => this.perform(input)
        const pending = input.action === 'status' || input.action === 'check' ? perform() : this.queue.then(perform, perform)
        if (!['status', 'check'].includes(input.action)) this.queue = pending.catch(() => {})
        response.end(JSON.stringify({ result: await pending }))
      } catch (error) {
        response.writeHead(400)
        response.end(JSON.stringify({ error: codeOf(error) }))
      }
    }
    this.server = http.createServer(handler)
    this.server.requestTimeout = 15000
    this.server.headersTimeout = 10000
    await new Promise((resolve, reject) => {
      this.server.once('error', reject)
      this.server.listen(0, '127.0.0.1', resolve)
    })
    const ipc = path.join(this.directory, 'ipc')
    fs.mkdirSync(ipc, { recursive: true, mode: 0o700 })
    let transport = 'tcp'
    if (process.platform !== 'win32') {
      const socket = path.join(ipc, 'coordinator.sock')
      if (fs.existsSync(socket)) {
        const previous = json(path.join(ipc, 'coordinator.json'), {})
        let alive = Boolean(previous.pid)
        try {
          if (alive) process.kill(previous.pid, 0)
        } catch (error) {
          if (error.code === 'ESRCH') alive = false
        }
        client.requireCondition(!alive && fs.lstatSync(socket).isSocket(), 'coordinator_already_running')
        fs.unlinkSync(socket)
      }
      this.unixServer = http.createServer(handler)
      this.unixServer.requestTimeout = 15000
      this.unixServer.headersTimeout = 10000
      try {
        await new Promise((resolve, reject) => {
          this.unixServer.once('error', reject)
          this.unixServer.listen(socket, resolve)
        })
      } catch (error) {
        await new Promise((resolve) => this.server.close(resolve))
        throw error
      }
      fs.chmodSync(socket, 0o600)
      transport = 'unix'
    }
    this.descriptor = { port: this.server.address().port, token: this.token, pid: process.pid, startedAt: Date.now(), transport }
    client.saveState(path.join(this.directory, 'coordinator.json'), this.descriptor)
    client.saveState(path.join(ipc, 'coordinator.json'), { ...this.descriptor, token: this.admissionToken })
    this.cleanup = setInterval(() => {
      for (const [id, at] of this.peers) if (Date.now() - at > 15000) this.peers.delete(id)
      if (!this.peers.size && Date.now() - this.descriptor.startedAt > 60000) this.close().catch(() => {})
    }, 5000)
    this.cleanup.unref()
    return this
  }
  async close() {
    if (this.closed) return
    this.closed = true
    clearInterval(this.cleanup)
    await Promise.allSettled([...this.controllers.values()].map((value) => value.controller.stop()))
    if (this.server) await new Promise((resolve) => this.server.close(resolve))
    if (this.unixServer) await new Promise((resolve) => this.unixServer.close(resolve))
    const filename = path.join(this.directory, 'coordinator.json')
    if (json(filename, {})?.token === this.token) fs.unlinkSync(filename)
    const admission = path.join(this.directory, 'ipc/coordinator.json')
    if (json(admission, {})?.token === this.admissionToken) fs.unlinkSync(admission)
  }
}

module.exports = { Coordinator, json, productKey }
