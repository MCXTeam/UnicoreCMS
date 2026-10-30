const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { spawn } = require('node:child_process')
const http = require('node:http')
const client = require('./sdk.cjs')
const protection = require('./protection.cjs')
const trustDefault = require('./trust.cjs')
const hostSecrets = new WeakMap()
const publicSnapshot = (value) => (value?.entries ? { ...value, entries: value.entries.map(({ permit, ...entry }) => entry) } : value)

const KEY = Symbol.for('unicore.license.host.v1')
const hosts = globalThis[KEY] || (globalThis[KEY] = new Map())
const activeKey = Symbol.for('unicore.license.active-host.v1')
const privateDirectory = (root) => path.join(root, '.unicore/licensing')
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
function needsLicenses(root, trust) {
  for (const [kind, folder] of [
    ['module', 'modules'],
    ['theme', 'themes'],
  ]) {
    const base = path.join(root, folder)
    if (!fs.existsSync(base)) continue
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const filename = path.join(base, entry.name, `${kind}.json`)
      if (!fs.existsSync(filename)) continue
      try {
        const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'))
        if (
          trust.catalog[`${kind}:${manifest.id}`] ||
          manifest.commercial ||
          fs.existsSync(path.join(base, entry.name, client.ARTIFACT_FILE))
        )
          return true
      } catch {}
    }
  }
  return false
}
function descriptor(root) {
  const directory = process.env.UNICORE_LICENSE_COORDINATOR_DIR || path.join(privateDirectory(root), 'ipc')
  const filename = path.join(directory, 'coordinator.json')
  if (!fs.existsSync(filename)) return null
  client.requireCondition(!fs.lstatSync(filename).isSymbolicLink(), 'private_state_symlink')
  client.requireCondition(fs.statSync(filename).size < 16384, 'private_state_too_large')
  const result = JSON.parse(fs.readFileSync(filename, 'utf8'))
  client.requireCondition(
    Number.isInteger(result.port) && result.port > 0 && result.port < 65536 && /^[A-Za-z0-9_-]{43}$/.test(result.token),
    'invalid_coordinator',
  )
  return { ...result, directory }
}
async function request(root, input, timeout = 20000) {
  let target = descriptor(root)
  client.requireCondition(target, 'coordinator_unavailable')
  if (!['status', 'check', 'attach'].includes(input.action)) {
    client.requireCondition(!process.env.UNICORE_LICENSE_COORDINATOR_DIR, 'coordinator_read_only')
    const filename = path.join(privateDirectory(root), 'coordinator.json')
    client.requireCondition(
      fs.existsSync(filename) && !fs.lstatSync(filename).isSymbolicLink() && fs.statSync(filename).size < 16384,
      'coordinator_unavailable',
    )
    target = { ...JSON.parse(fs.readFileSync(filename, 'utf8')), directory: target.directory }
  }
  const body = await new Promise((resolve, reject) => {
    const inputBody = JSON.stringify(input)
    const outgoing = http.request(
      {
        ...(target.transport === 'unix'
          ? { socketPath: path.join(target.directory, 'coordinator.sock') }
          : { host: '127.0.0.1', port: target.port }),
        path: '/',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${target.token}`,
          'content-length': Buffer.byteLength(inputBody),
        },
      },
      (incoming) => {
        let size = 0
        const chunks = []
        incoming.on('data', (chunk) => {
          size += chunk.length
          if (size > 1024 * 1024) outgoing.destroy(new client.LicenseError('coordinator_response_too_large'))
          else chunks.push(chunk)
        })
        incoming.once('error', reject)
        incoming.once('end', () => {
          try {
            const result = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            client.requireCondition(incoming.statusCode === 200 && !result.error, result.error || 'coordinator_unavailable')
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
      },
    )
    const timer = setTimeout(() => outgoing.destroy(new client.LicenseError('coordinator_unavailable')), timeout)
    outgoing.once('close', () => clearTimeout(timer))
    outgoing.once('error', reject)
    outgoing.end(inputBody)
  })
  return body.result
}
async function ensureCoordinator(root) {
  try {
    await request(root, { action: 'status' }, 1000)
    return
  } catch {}
  client.requireCondition(!process.env.UNICORE_LICENSE_COORDINATOR_DIR, 'coordinator_unavailable')
  fs.mkdirSync(privateDirectory(root), { recursive: true, mode: 0o700 })
  const lock = path.join(privateDirectory(root), 'startup.lock')
  let owned = false
  try {
    try {
      fs.mkdirSync(lock)
      owned = true
      client.saveState(path.join(lock, 'owner.json'), { pid: process.pid })
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      const owner = path.join(lock, 'owner.json')
      if (fs.existsSync(owner)) {
        const pid = JSON.parse(fs.readFileSync(owner, 'utf8')).pid
        let alive = true
        try {
          process.kill(pid, 0)
        } catch (failure) {
          if (failure.code === 'ESRCH') alive = false
        }
        if (!alive) {
          fs.rmSync(lock, { recursive: true })
          return ensureCoordinator(root)
        }
      } else if (Date.now() - fs.statSync(lock).mtimeMs > 30000) {
        fs.rmSync(lock, { recursive: true })
        return ensureCoordinator(root)
      }
    }
    if (owned) {
      try {
        await request(root, { action: 'status' }, 500)
        return
      } catch {}
      const worker = spawn(process.execPath, [require.resolve('./worker.cjs'), root], { stdio: 'ignore', windowsHide: true })
      worker.on('error', () => {})
      worker.unref()
    }
    for (let i = 0; i < 80; i++) {
      try {
        await request(root, { action: 'status' }, 500)
        return
      } catch {}
      await pause(100)
    }
    throw new client.LicenseError('coordinator_unavailable')
  } finally {
    if (owned) fs.rmSync(lock, { recursive: true, force: true })
  }
}

class LicenseHost {
  constructor(root) {
    this.root = path.resolve(root)
    this.trust = trustDefault
    this.peerId = `${process.pid}:${crypto.randomUUID()}`
    this.peerNonce = crypto.randomBytes(32).toString('base64url')
    hostSecrets.set(this, { recipient: protection.newRecipient(), keys: new Map() })
    this.entries = new Map()
    this.admitted = new Set()
    this.denied = new Set()
    this.proofs = new Map()
    this.listeners = new Set()
    this.busy = false
    this.closed = false
  }
  apply(snapshot, start, attach = false) {
    const next = new Map()
    for (const entry of snapshot.entries) {
      let allowed = false,
        reason = entry.reason,
        deadline = 0,
        expiresAt = 0
      if (entry.allowed)
        try {
          const permit = client.verifyEnvelope(entry.permit, this.trust.issuerKeys, client.domains.license)
          client.requireCondition(
            permit.type === 'runtime' && permit.schema === 1 && this.trust.catalog[entry.key] === permit.productId,
            'invalid_runtime_permit',
          )
          for (const field of ['productId', 'kind', 'releaseId', 'artifactDigest'])
            client.requireCondition(permit[field] === entry[field], 'runtime_binding_mismatch')
          client.requireCondition(entry.key === `${entry.kind}:${entry.id}`, 'runtime_binding_mismatch')
          client.requireCondition(
            permit.extensionId === entry.id && Number.isSafeInteger(permit.revision) && Number.isSafeInteger(permit.decisionSequence),
            'runtime_binding_mismatch',
          )
          client.requireCondition(
            Number.isSafeInteger(permit.issuedAt) &&
              Number.isSafeInteger(permit.offlineUntil) &&
              permit.offlineUntil > permit.issuedAt &&
              permit.offlineUntil <= permit.issuedAt + 30 * 60000 &&
              permit.issuedAt <= Date.now() + 300000 &&
              permit.offlineUntil > Date.now(),
            'runtime_expired',
          )
          const previous = this.proofs.get(entry.key)
          if (attach)
            client.requireCondition(
              permit.peerNonce === this.peerNonce && Math.abs(permit.issuedAt - Date.now()) <= 300000,
              'runtime_online_required',
            )
          else {
            client.requireCondition(previous, 'runtime_online_required')
            for (const field of ['installationId', 'activationId', 'licenseId', 'runtimeId', 'keyFingerprint', 'origin'])
              client.requireCondition(permit[field] === previous.permit[field], 'runtime_binding_mismatch')
            client.requireCondition(
              permit.revision >= previous.permit.revision &&
                permit.decisionSequence >= previous.permit.decisionSequence &&
                permit.issuedAt >= previous.permit.issuedAt,
              'response_rollback',
            )
          }
          const digest = client.digest(permit)
          if (previous && permit.decisionSequence === previous.permit.decisionSequence)
            client.requireCondition(digest === previous.digest, 'response_rollback')
          if (attach && permit.keyCapsule) {
            const secret = hostSecrets.get(this)
            client.requireCondition(
              permit.recipientFingerprint === secret.recipient.fingerprint && permit.keyCapsule.kid === secret.recipient.fingerprint,
              'recipient_binding_mismatch',
            )
            const key = protection.unwrap(permit.keyCapsule, secret.recipient.privateKey, protection.runtimeContext(permit))
            secret.keys.get(entry.key)?.key.fill(0)
            secret.keys.set(entry.key, { key, artifactDigest: permit.artifactDigest, releaseId: permit.releaseId })
          }
          deadline =
            previous?.digest === digest
              ? previous.deadline
              : start + Math.max(0, Math.min(30 * 60000, permit.offlineUntil - Date.now(), permit.offlineUntil - permit.issuedAt))
          this.proofs.set(entry.key, { permit, digest, deadline })
          expiresAt = permit.offlineUntil
          if (attach) this.admitted.add(entry.key)
          allowed = this.admitted.has(entry.key) && !this.denied.has(entry.key) && performance.now() < deadline
        } catch (error) {
          reason = error instanceof client.LicenseError ? error.code : 'invalid_runtime_permit'
        }
      next.set(entry.key, { ...entry, reason, deadline, expiresAt, allowed })
    }
    const previous = this.entries
    this.entries = next
    this.configured = snapshot.configured
    for (const [key, value] of hostSecrets.get(this).keys)
      if (!this.allowedKey(key)) {
        value.key.fill(0)
        hostSecrets.get(this).keys.delete(key)
      }
    for (const [key, old] of previous)
      if (old.allowed && !this.allowedKey(key)) {
        this.denied.add(key)
        for (const listener of this.listeners) {
          try {
            Promise.resolve(listener(key, next.get(key)?.reason || 'runtime_denied')).catch(() => {})
          } catch {}
        }
      }
  }
  async start({ spawnCoordinator = true } = {}) {
    if (spawnCoordinator) await ensureCoordinator(this.root)
    const started = performance.now()
    this.apply(
      await request(this.root, {
        action: 'attach',
        peerId: this.peerId,
        peerNonce: this.peerNonce,
        recipientPublicKey: hostSecrets.get(this).recipient.publicKey,
      }),
      started,
      true,
    )
    this.timer = setInterval(() => this.refresh().catch(() => {}), 1000)
    this.timer.unref()
    hosts.set(this.root, this)
    globalThis[activeKey] = this
    return this
  }
  async refresh() {
    this.expire()
    if (this.busy || this.closed) return
    this.busy = true
    try {
      const started = performance.now()
      this.apply(await request(this.root, { action: 'status', peerId: this.peerId }, 2000), started)
    } finally {
      this.busy = false
    }
  }
  expire() {
    for (const [key, entry] of this.entries)
      if (entry.allowed && !this.allowedKey(key)) {
        entry.allowed = false
        entry.reason = 'runtime_expired'
        this.denied.add(key)
        hostSecrets.get(this).keys.get(key)?.key.fill(0)
        hostSecrets.get(this).keys.delete(key)
        for (const listener of this.listeners) {
          try {
            Promise.resolve(listener(key, entry.reason)).catch(() => {})
          } catch {}
        }
      }
  }
  allowedKey(key) {
    const item = this.entries.get(key)
    return Boolean(!this.closed && item?.allowed && performance.now() < item.deadline && Date.now() < item.expiresAt)
  }
  commercial(kind, id, manifest, directory) {
    return Boolean(
      this.trust.catalog[`${kind}:${id}`] ||
      manifest?.commercial ||
      this.entries.has(`${kind}:${id}`) ||
      (directory && fs.existsSync(path.join(directory, client.ARTIFACT_FILE))),
    )
  }
  assert(kind, id) {
    const key = `${kind}:${id}`
    client.requireCondition(this.allowedKey(key), this.entries.get(key)?.reason || 'activation_required')
  }
  assertExtension({ kind, id, directory, manifest }) {
    if (!this.commercial(kind, id, manifest, directory)) return { licensed: false }
    this.assert(kind, id)
    const entry = this.entries.get(`${kind}:${id}`)
    const checked = client.verifyArtifact(directory, this.trust.publisherKeys, { productId: entry.productId, kind, extensionId: id })
    client.requireCondition(
      checked.artifactDigest === entry.artifactDigest && checked.artifact.releaseId === entry.releaseId,
      'artifact_binding_mismatch',
    )
    return { licensed: true, artifact: checked.artifact }
  }
  async requireLive(kind, id) {
    this.assert(kind, id)
    const started = performance.now()
    const snapshot = await request(this.root, { action: 'check', kind, id, peerId: this.peerId }, 2000)
    this.apply(snapshot, started)
    this.assert(kind, id)
  }
  loadModulePayload(id, target) {
    client.requireCondition(
      target && typeof target.filename === 'string' && typeof target._compile === 'function',
      'invalid_payload_target',
    )
    const directory = path.dirname(path.dirname(target.filename))
    client.requireCondition(directory.startsWith(path.join(this.root, 'modules') + path.sep), 'invalid_payload_directory')
    const { artifact } = this.assertExtension({ kind: 'module', id, directory })
    const value = protection.validateProtection(artifact)
    client.requireCondition(path.resolve(directory, value.entry) === target.filename, 'payload_entry_mismatch')
    const secret = hostSecrets.get(this).keys.get(`module:${id}`)
    const entry = this.entries.get(`module:${id}`)
    client.requireCondition(
      secret && secret.artifactDigest === entry.artifactDigest && secret.releaseId === artifact.releaseId,
      'payload_key_required',
    )
    const code = protection.openCode(fs.readFileSync(path.join(directory, value.payload)), secret.key, artifact)
    try {
      target._compile(code.toString('utf8'), target.filename)
      return target.exports
    } finally {
      code.fill(0)
    }
  }
  async operation(input) {
    await ensureCoordinator(this.root)
    return publicSnapshot(await request(this.root, input))
  }
  async inspect() {
    if (!needsLicenses(this.root, this.trust) && !descriptor(this.root)) return { configured: Boolean(this.trust.server), entries: [] }
    return this.operation({ action: 'status' })
  }
  onBlocked(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }
  close() {
    this.closed = true
    clearInterval(this.timer)
    const secret = hostSecrets.get(this)
    for (const value of secret.keys.values()) value.key.fill(0)
    secret.keys.clear()
    secret.recipient = null
    if (hosts.get(this.root) === this) hosts.delete(this.root)
  }
}

async function prepareLicenses(root, options) {
  root = path.resolve(root)
  const existing = hosts.get(root)
  if (existing && !existing.closed) return existing
  const host = new LicenseHost(root)
  if (!needsLicenses(root, host.trust)) {
    hosts.set(root, host)
    globalThis[activeKey] = host
    return host
  }
  if (process.env.UNICORE_LICENSE_ATTACH_ONLY === '1') options = { ...options, spawnCoordinator: false }
  try {
    return await host.start(options)
  } catch {
    hosts.set(root, host)
    globalThis[activeKey] = host
    return host
  }
}
function currentHost(root) {
  return root ? hosts.get(path.resolve(root)) : globalThis[activeKey]
}
function assertExtension(input) {
  const host = currentHost(input.root) || currentHost()
  if (host) return host.assertExtension(input)
  const commercial =
    trustDefault.catalog[`${input.kind}:${input.id}`] ||
    input.manifest?.commercial ||
    fs.existsSync(path.join(input.directory, client.ARTIFACT_FILE))
  client.requireCondition(!commercial, 'runtime_online_required')
  return { licensed: false }
}
function commercialExtension(input) {
  const host = currentHost(input.root) || currentHost()
  return host
    ? host.commercial(input.kind, input.id, input.manifest, input.directory)
    : Boolean(
        trustDefault.catalog[`${input.kind}:${input.id}`] ||
        input.manifest?.commercial ||
        (input.directory && fs.existsSync(path.join(input.directory, client.ARTIFACT_FILE))),
      )
}
function assertModuleLicense(id) {
  const host = currentHost()
  client.requireCondition(host, 'runtime_online_required')
  host.assert('module', id)
}
function loadModulePayload(id, target) {
  const host = currentHost()
  client.requireCondition(host, 'runtime_online_required')
  return host.loadModulePayload(id, target)
}
async function requireModuleLicense(id) {
  assertModuleLicense(id)
  await currentHost().requireLive('module', id)
}
function assertThemeLicense(id, releaseId, artifactDigest) {
  const host = currentHost()
  client.requireCondition(host, 'runtime_online_required')
  host.assert('theme', id)
  const entry = host.entries.get(`theme:${id}`)
  client.requireCondition(entry.releaseId === releaseId && entry.artifactDigest === artifactDigest, 'artifact_binding_mismatch')
}
function moduleAllowed(id) {
  const host = currentHost()
  if (!host) return !trustDefault.catalog[`module:${id}`]
  if (!host.commercial('module', id)) return true
  return host.allowedKey(`module:${id}`)
}
async function startFrontend(options) {
  return require('./frontend.cjs').startFrontend(options)
}

module.exports = {
  LicenseHost,
  prepareLicenses,
  currentHost,
  assertExtension,
  commercialExtension,
  assertModuleLicense,
  requireModuleLicense,
  assertThemeLicense,
  moduleAllowed,
  loadModulePayload,
  request,
  ensureCoordinator,
  startFrontend,
}
