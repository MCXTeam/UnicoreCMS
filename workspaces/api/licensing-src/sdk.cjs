const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const protection = require('./protection.cjs')
const { LicenseError } = require('./errors.cjs')
const { keyFingerprint, normalizeOrigin, validateCustomerTrust } = require('./trust-policy.cjs')(LicenseError)

const ARTIFACT_FILE = '.unicore-release.json'
const MAX_FILES = 5000
const MAX_BYTES = 256 * 1024 * 1024
const domains = { artifact: 'unicore.artifact.v1', license: 'unicore.license.v1', request: 'unicore.request.v1' }
const runtimeMemory = new WeakMap()
const RUNTIME_TTL = 30 * 60000

function requireCondition(value, code = 'invalid_document') {
  if (!value) throw new LicenseError(code)
}

function canonical(value, depth = 0) {
  requireCondition(depth < 30, 'document_too_deep')
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') {
    requireCondition(Number.isSafeInteger(value), 'non_integer')
    return String(value)
  }
  if (Array.isArray(value)) return '[' + value.map((item) => canonical(item, depth + 1)).join(',') + ']'
  requireCondition(value && [Object.prototype, null].includes(Object.getPrototypeOf(value)), 'invalid_json_type')
  return (
    '{' +
    Object.keys(value)
      .sort()
      .map((key) => JSON.stringify(key) + ':' + canonical(value[key], depth + 1))
      .join(',') +
    '}'
  )
}

function signedBytes(domain, document) {
  requireCondition(Object.values(domains).includes(domain))
  return Buffer.from(domain + '\0' + canonical(document))
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}
function digest(value) {
  return sha256(canonical(value))
}
function verifyEnvelope(envelope, keys, domain) {
  requireCondition(envelope && envelope.alg === 'Ed25519' && typeof envelope.kid === 'string', 'invalid_signature')
  requireCondition(Object.hasOwn(keys, envelope.kid), 'unknown_key')
  requireCondition(typeof envelope.signature === 'string' && /^[A-Za-z0-9_-]{86}$/.test(envelope.signature), 'invalid_signature')
  const signature = Buffer.from(envelope.signature, 'base64url')
  requireCondition(signature.length === 64 && signature.toString('base64url') === envelope.signature, 'invalid_signature')
  const key = crypto.createPublicKey(keys[envelope.kid])
  requireCondition(key.asymmetricKeyType === 'ed25519', 'unsupported_key')
  requireCondition(
    crypto.verify(null, signedBytes(domain, { alg: envelope.alg, kid: envelope.kid, payload: envelope.payload }), key, signature),
    'invalid_signature',
  )
  return envelope.payload
}

function signRequest(payload, privateKey) {
  return { payload, signature: crypto.sign(null, signedBytes(domains.request, payload), privateKey).toString('base64url') }
}

function verifyRequest(request, publicKey) {
  requireCondition(request && typeof request.signature === 'string' && /^[A-Za-z0-9_-]{86}$/.test(request.signature), 'invalid_proof')
  const key = crypto.createPublicKey(publicKey)
  requireCondition(key.asymmetricKeyType === 'ed25519', 'unsupported_key')
  requireCondition(
    crypto.verify(null, signedBytes(domains.request, request.payload), key, Buffer.from(request.signature, 'base64url')),
    'invalid_proof',
  )
  return request.payload
}

function safeFileName(name) {
  requireCondition(typeof name === 'string' && name.length > 0 && name.length < 500, 'invalid_file_path')
  requireCondition(!name.includes('\\') && !name.includes('\0') && !name.startsWith('/') && !name.includes(':'), 'invalid_file_path')
  requireCondition(
    name
      .split('/')
      .every(
        (part) =>
          part &&
          part !== '.' &&
          part !== '..' &&
          !/[\x00-\x1f\x7f<>"|?*]/.test(part) &&
          !/[. ]$/.test(part) &&
          !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
      ),
    'invalid_file_path',
  )
  return name
}

function distributableFile(name) {
  safeFileName(name)
  requireCondition(
    !/(^|\/)(\.env(?:\..*)?|\.git|\.unicore|\.unicore-updater[^/]*|initial-admin\.txt|node_modules|storage|server-src|test|tests)(\/|$)|\.map$|\.(?:pem|key)$/i.test(
      name,
    ),
    'private_file_in_package',
  )
  requireCondition(
    !/(^|\/)(?:tsup\.config\.[^/]+|tsconfig[^/]*\.json|\.npmrc|\.pnpmfile\.[^/]+|config\.(?:private|production)\.[^/]+)$/i.test(name),
    'private_file_in_package',
  )
}

function inventory(directory) {
  requireCondition(!fs.lstatSync(directory).isSymbolicLink(), 'symlink_not_allowed')
  const result = Object.create(null)
  let total = 0
  function visit(current, prefix) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = safeFileName(prefix + entry.name)
      const target = path.join(current, entry.name)
      const stat = fs.lstatSync(target)
      requireCondition(!stat.isSymbolicLink(), 'symlink_not_allowed')
      if (stat.isDirectory()) {
        visit(target, name + '/')
        continue
      }
      requireCondition(stat.isFile(), 'special_file_not_allowed')
      if (name === ARTIFACT_FILE) continue
      distributableFile(name)
      requireCondition(Object.keys(result).length < MAX_FILES && stat.size <= 32 * 1024 * 1024, 'package_too_large')
      total += stat.size
      requireCondition(total <= MAX_BYTES, 'package_too_large')
      const bytes = fs.readFileSync(target)
      result[name] = { bytes: bytes.length, sha256: sha256(bytes) }
    }
  }
  visit(directory, '')
  return result
}

function verifyArtifact(directory, publisherKeys, expected) {
  const documentPath = path.join(directory, ARTIFACT_FILE)
  requireCondition(!fs.lstatSync(documentPath).isSymbolicLink() && fs.statSync(documentPath).size < 2 * 1024 * 1024, 'invalid_artifact')
  const envelope = JSON.parse(fs.readFileSync(documentPath, 'utf8'))
  const artifact = verifyEnvelope(envelope, publisherKeys, domains.artifact)
  requireCondition(
    artifact.schema === 1 &&
      artifact.productId === expected.productId &&
      artifact.kind === expected.kind &&
      artifact.extensionId === expected.extensionId,
    'artifact_binding_mismatch',
  )
  requireCondition(
    typeof artifact.releaseId === 'string' &&
      Number.isSafeInteger(artifact.publishedAt) &&
      Number.isSafeInteger(artifact.sequence) &&
      artifact.sequence > 0,
    'invalid_artifact',
  )
  for (const name of Object.keys(artifact.files)) safeFileName(name)
  requireCondition(canonical(inventory(directory)) === canonical(artifact.files), 'artifact_tampered')
  const manifestName = artifact.kind === 'module' ? 'module.json' : 'theme.json'
  requireCondition(Object.hasOwn(artifact.files, manifestName), 'missing_manifest')
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, manifestName), 'utf8'))
  verifyManifest(artifact, manifest)
  return { artifact, artifactDigest: digest(envelope) }
}

function verifyManifest(artifact, manifest) {
  requireCondition(manifest.id === artifact.extensionId && manifest.version === artifact.version, 'manifest_binding_mismatch')
  requireCondition(
    manifest.commercial?.productId === artifact.productId && manifest.commercial?.protocol === 1,
    'commercial_marker_missing',
  )
  if (manifest.commercial.runtime === 'encrypted-v1') {
    const value = protection.validateProtection(artifact)
    requireCondition(
      manifest.server?.replace(/^\.\//, '') === value.entry &&
        Object.hasOwn(artifact.files, value.entry) &&
        Object.hasOwn(artifact.files, value.payload),
      'protected_payload_missing',
    )
  } else requireCondition(!artifact.protection, 'unexpected_payload_protection')
}

function verifyLease(envelope, issuerKeys, expected, now = Date.now()) {
  const lease = verifyEnvelope(envelope, issuerKeys, domains.license)
  requireCondition(lease.schema === 1 && lease.type === 'lease', 'not_a_lease')
  for (const key of ['productId', 'kind', 'releaseId', 'artifactDigest', 'installationId', 'keyFingerprint', 'origin']) {
    requireCondition(lease[key] === expected[key], 'license_binding_mismatch')
  }
  requireCondition(Number.isSafeInteger(lease.issuedAt) && lease.issuedAt <= now + 300000, 'clock_rollback')
  requireCondition(Number.isSafeInteger(lease.revision) && lease.revision > 0, 'invalid_revision')
  requireCondition(Number.isSafeInteger(lease.decisionSequence) && lease.decisionSequence > 0, 'invalid_decision_sequence')
  requireCondition(lease.useMode === 'perpetual' || lease.useMode === 'subscription', 'invalid_use_mode')
  if (lease.useMode === 'subscription') {
    requireCondition(Number.isSafeInteger(lease.offlineUntil) && Number.isSafeInteger(lease.paidUntil), 'invalid_expiry')
    requireCondition(
      lease.offlineUntil <= lease.issuedAt + 7 * 86400000 && lease.offlineUntil <= lease.paidUntil + 3 * 86400000,
      'invalid_expiry',
    )
    requireCondition(now < lease.offlineUntil, 'license_expired')
  } else requireCondition(lease.offlineUntil === null, 'invalid_perpetual_receipt')
  return lease
}

function admitExtension({ directory, kind, extensionId, catalog, state, issuerKeys, publisherKeys, origin, runtime, now = Date.now() }) {
  const productId = catalog[`${kind}:${extensionId}`]
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, kind === 'module' ? 'module.json' : 'theme.json'), 'utf8'))
  if (!productId) {
    requireCondition(!manifest.commercial && !fs.existsSync(path.join(directory, ARTIFACT_FILE)), 'unknown_commercial_product')
    return { licensed: false, manifest }
  }
  requireCondition(state && state.lease, 'activation_required')
  requireCondition(now >= (state.lastSignedAt || 0) - 300000, 'clock_rollback')
  if (state.denial) {
    const denial = verifyEnvelope(state.denial, issuerKeys, domains.license)
    requireCondition(
      denial.installationId === state.installationId &&
        denial.productId === productId &&
        denial.kind === kind &&
        ['denial', 'deactivated'].includes(denial.type),
      'invalid_denial',
    )
    const leasePayload = verifyEnvelope(state.lease, issuerKeys, domains.license)
    requireCondition(denial.activationId === leasePayload.activationId && Number.isSafeInteger(denial.decisionSequence), 'invalid_denial')
    const global = denial.type === 'deactivated' || ['revoked', 'activation_inactive'].includes(denial.reason)
    requireCondition(
      (!global && denial.releaseId !== leasePayload.releaseId) || denial.decisionSequence < leasePayload.decisionSequence,
      'license_denied',
    )
  }
  const checked = verifyArtifact(directory, publisherKeys, { productId, kind, extensionId })
  const publicKey = crypto.createPublicKey(state.privateKey).export({ type: 'spki', format: 'pem' })
  const lease = verifyLease(
    state.lease,
    issuerKeys,
    {
      productId,
      kind,
      releaseId: checked.artifact.releaseId,
      artifactDigest: checked.artifactDigest,
      installationId: state.installationId,
      keyFingerprint: keyFingerprint(publicKey),
      origin,
    },
    now,
  )
  requireRuntime(runtime, lease, issuerKeys, now)
  return { licensed: true, manifest, lease, artifact: checked.artifact }
}

function newRuntime() {
  const pair = crypto.generateKeyPairSync('ed25519')
  const runtime = {
    runtimeId: crypto.randomUUID(),
    privateKey: pair.privateKey.export({ type: 'pkcs8', format: 'pem' }),
    publicKey: pair.publicKey.export({ type: 'spki', format: 'pem' }),
  }
  runtimeMemory.set(runtime, { pending: new Map(), last: null, grant: null, blocked: false, closed: false, deadline: 0 })
  return runtime
}

function runtimeRequest(operation, installation, runtime, payload, at = Date.now()) {
  requireCondition(['start', 'heartbeat', 'stop'].includes(operation), 'invalid_operation')
  const memory = runtimeMemory.get(runtime)
  requireCondition(memory, 'runtime_online_required')
  requireCondition(!memory.closed || operation === 'stop', 'runtime_closed')
  const proof = {
    ...payload,
    op: operation,
    installationId: installation.installationId,
    runtimeId: runtime.runtimeId,
    runtimePublicKey: runtime.publicKey,
    at,
    nonce: crypto.randomBytes(24).toString('base64url'),
    ...(memory.challenge ? { conflictChallenge: memory.challenge } : {}),
  }
  requireCondition(memory.pending.size < 8, 'too_many_pending_requests')
  memory.pending.set(proof.nonce, { payload: proof, at: performance.now() })
  return signRequest({ ...proof, runtimeProof: signRequest(proof, runtime.privateKey).signature }, installation.privateKey)
}

function cacheRuntimeResponse(runtime, envelope, issuerKeys, { installation, productId, kind, origin, now = Date.now() }) {
  const memory = runtimeMemory.get(runtime)
  requireCondition(memory, 'runtime_online_required')
  const result = verifyEnvelope(envelope, issuerKeys, domains.license)
  const pending = memory.pending.get(result.requestNonce)
  requireCondition(pending, 'runtime_response_not_requested')
  for (const field of ['installationId', 'activationId', 'releaseId', 'runtimeId'])
    requireCondition(result[field] === pending.payload[field], 'response_binding_mismatch')
  if (pending.payload.peerNonce && result.type === 'runtime')
    requireCondition(result.peerNonce === pending.payload.peerNonce, 'response_binding_mismatch')
  requireCondition(
    result.productId === productId &&
      result.kind === kind &&
      result.origin === origin &&
      result.keyFingerprint === keyFingerprint(installation.publicKey),
    'response_binding_mismatch',
  )
  requireCondition(
    Number.isSafeInteger(result.issuedAt) && Math.abs(now - result.issuedAt) <= 300000 && Number.isSafeInteger(result.decisionSequence),
    'invalid_runtime_response',
  )
  requireCondition(
    !memory.last ||
      (result.revision >= memory.last.revision &&
        result.decisionSequence > memory.last.decisionSequence &&
        result.issuedAt >= memory.last.issuedAt),
    'response_rollback',
  )
  requireCondition(['runtime', 'denial', 'runtime_stopped'].includes(result.type), 'invalid_response')
  requireCondition(!memory.closed || pending.payload.op === 'stop', 'runtime_closed')
  if (result.type === 'runtime') {
    requireCondition(
      ['start', 'heartbeat'].includes(pending.payload.op) && result.runtimeKeyFingerprint === keyFingerprint(runtime.publicKey),
      'response_binding_mismatch',
    )
    requireCondition(
      Number.isSafeInteger(result.offlineUntil) &&
        result.offlineUntil > now &&
        result.offlineUntil > result.issuedAt &&
        result.offlineUntil <= result.issuedAt + RUNTIME_TTL,
      'invalid_expiry',
    )
    requireCondition(
      Number.isSafeInteger(result.refreshAfter) && result.refreshAfter > result.issuedAt && result.refreshAfter <= result.offlineUntil,
      'invalid_expiry',
    )
    memory.grant = envelope
    memory.blocked = false
    memory.deadline = pending.at + Math.min(RUNTIME_TTL, result.offlineUntil - result.issuedAt)
  } else {
    requireCondition(result.type !== 'runtime_stopped' || pending.payload.op === 'stop', 'invalid_response')
    if (
      result.type === 'runtime_stopped' ||
      ['revoked', 'activation_inactive', 'runtime_expired', 'runtime_closed', 'runtime_conflict_pending', 'transfer_wait'].includes(
        result.reason,
      ) ||
      !memory.grant ||
      memory.grant.payload.releaseId === result.releaseId
    )
      memory.blocked = true
  }
  memory.challenge = result.conflictChallenge || null
  memory.pending.delete(result.requestNonce)
  memory.last = result
  return result
}

function requireRuntime(runtime, lease, issuerKeys, now = Date.now()) {
  const memory = runtimeMemory.get(runtime)
  requireCondition(memory && memory.grant, 'runtime_online_required')
  requireCondition(!memory.blocked && !memory.closed, 'runtime_denied')
  const grant = verifyEnvelope(memory.grant, issuerKeys, domains.license)
  for (const field of ['licenseId', 'activationId', 'installationId', 'productId', 'kind', 'releaseId', 'origin', 'keyFingerprint'])
    requireCondition(grant[field] === lease[field], 'runtime_binding_mismatch')
  requireCondition(now >= grant.issuedAt - 300000, 'clock_rollback')
  requireCondition(now < grant.offlineUntil && performance.now() < memory.deadline, 'runtime_expired')
  return grant
}

function closeRuntime(runtime) {
  const memory = runtimeMemory.get(runtime)
  requireCondition(memory, 'runtime_online_required')
  memory.closed = true
  memory.blocked = true
}

function runtimeRemaining(runtime) {
  const memory = runtimeMemory.get(runtime)
  requireCondition(memory && memory.grant && !memory.closed && !memory.blocked, 'runtime_denied')
  return Math.max(0, Math.min(memory.deadline - performance.now(), memory.grant.payload.offlineUntil - Date.now()))
}

function newInstallation() {
  const pair = crypto.generateKeyPairSync('ed25519')
  return {
    installationId: crypto.randomUUID(),
    privateKey: pair.privateKey.export({ type: 'pkcs8', format: 'pem' }),
    publicKey: pair.publicKey.export({ type: 'spki', format: 'pem' }),
  }
}

function saveState(filename, state) {
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 })
  const temporary = filename + '.' + crypto.randomUUID() + '.tmp'
  try {
    fs.writeFileSync(temporary, JSON.stringify(state), { mode: 0o600, flag: 'wx' })
    fs.renameSync(temporary, filename)
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary)
  }
}

async function licensingRequest({
  server,
  operation,
  payload,
  installation,
  issuerKeys,
  allowLocal = false,
  previous,
  runtime,
  productId,
  kind,
}) {
  const endpoint = normalizeOrigin(server, allowLocal)
  requireCondition(
    ['activate', 'lease', 'deactivate', 'catalog', 'start', 'heartbeat', 'stop', 'transfer'].includes(operation),
    'invalid_operation',
  )
  const usesRuntime = ['start', 'heartbeat', 'stop'].includes(operation)
  const request = usesRuntime
    ? runtimeRequest(operation, installation, runtime, payload)
    : signRequest(
        {
          ...payload,
          op: operation,
          installationId: installation.installationId,
          nonce: crypto.randomBytes(24).toString('base64url'),
          at: Date.now(),
        },
        installation.privateKey,
      )
  const requestPayload = request.payload
  try {
    const response = await fetch(endpoint + '/v1/' + operation, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    })
    requireCondition(Number(response.headers.get('content-length') || 0) < 256 * 1024, 'response_too_large')
    const chunks = []
    let size = 0
    for await (const chunk of response.body) {
      size += chunk.length
      requireCondition(size < 256 * 1024, 'response_too_large')
      chunks.push(Buffer.from(chunk))
    }
    const text = Buffer.concat(chunks).toString('utf8')
    const envelope = JSON.parse(text)
    const result = verifyEnvelope(envelope, issuerKeys, domains.license)
    requireCondition(
      result.requestNonce === requestPayload.nonce && result.installationId === installation.installationId,
      'response_binding_mismatch',
    )
    requireCondition(
      result.keyFingerprint ===
        keyFingerprint(installation.publicKey || crypto.createPublicKey(installation.privateKey).export({ type: 'spki', format: 'pem' })),
      'response_binding_mismatch',
    )
    if (payload.activationId) requireCondition(result.activationId === payload.activationId, 'response_binding_mismatch')
    if (payload.releaseId) requireCondition(result.releaseId === payload.releaseId, 'response_binding_mismatch')
    if (payload.origin) requireCondition(result.origin === normalizeOrigin(payload.origin, allowLocal), 'response_binding_mismatch')
    requireCondition(Number.isSafeInteger(result.issuedAt) && Math.abs(Date.now() - result.issuedAt) <= 300000, 'stale_response')
    requireCondition(
      !previous ||
        (result.revision >= previous.revision &&
          result.issuedAt >= previous.issuedAt &&
          result.decisionSequence > previous.decisionSequence),
      'response_rollback',
    )
    requireCondition(
      ['lease', 'denial', 'deactivated', 'catalog', 'runtime', 'runtime_stopped', 'transfer'].includes(result.type),
      'invalid_response',
    )
    requireCondition(
      result.type === 'denial' ||
        result.type ===
          {
            activate: 'lease',
            lease: 'lease',
            catalog: 'catalog',
            deactivate: 'deactivated',
            start: 'runtime',
            heartbeat: 'runtime',
            stop: 'runtime_stopped',
            transfer: 'transfer',
          }[operation],
      'invalid_response',
    )
    requireCondition(response.status === (result.type === 'denial' ? 403 : 200), 'invalid_response_status')
    if (result.type === 'catalog')
      requireCondition(result.expiresAt > Date.now() && result.expiresAt <= result.issuedAt + 600000, 'expired_catalog')
    if (usesRuntime) cacheRuntimeResponse(runtime, envelope, issuerKeys, { installation, productId, kind, origin: payload.origin })
    return { envelope, result, denied: result.type === 'denial' }
  } finally {
    if (usesRuntime) runtimeMemory.get(runtime)?.pending.delete(requestPayload.nonce)
  }
}

async function downloadRelease({ server, installation, lease, issuerKeys, allowLocal = false }) {
  const entitlement = verifyEnvelope(lease, issuerKeys, domains.license)
  requireCondition(
    entitlement.type === 'lease' &&
      entitlement.installationId === installation.installationId &&
      entitlement.keyFingerprint ===
        keyFingerprint(installation.publicKey || crypto.createPublicKey(installation.privateKey).export({ type: 'spki', format: 'pem' })),
    'license_binding_mismatch',
  )
  requireCondition(entitlement.useMode === 'perpetual' || Date.now() < entitlement.offlineUntil, 'license_expired')
  const { activationId, releaseId, archiveHash } = entitlement
  requireCondition(typeof archiveHash === 'string' && /^[a-f0-9]{64}$/.test(archiveHash), 'invalid_archive_digest')
  const endpoint = normalizeOrigin(server, allowLocal)
  const payload = {
    op: 'download',
    installationId: installation.installationId,
    activationId,
    releaseId,
    at: Date.now(),
    nonce: crypto.randomBytes(24).toString('base64url'),
  }
  const response = await fetch(endpoint + '/v1/download', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(signRequest(payload, installation.privateKey)),
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  })
  requireCondition(response.ok && response.headers.get('content-type') === 'application/zip', 'download_denied')
  const chunks = []
  let size = 0
  for await (const chunk of response.body) {
    size += chunk.length
    requireCondition(size <= MAX_BYTES, 'package_too_large')
    chunks.push(Buffer.from(chunk))
  }
  const bytes = Buffer.concat(chunks)
  requireCondition(sha256(bytes) === archiveHash, 'archive_digest_mismatch')
  return bytes
}

function cacheResponse(state, envelope, issuerKeys, { productId, kind, origin }) {
  const result = verifyEnvelope(envelope, issuerKeys, domains.license)
  requireCondition(
    result.installationId === state.installationId &&
      result.keyFingerprint === keyFingerprint(crypto.createPublicKey(state.privateKey).export({ type: 'spki', format: 'pem' })),
    'response_binding_mismatch',
  )
  requireCondition(result.productId === productId && result.kind === kind && result.origin === origin, 'response_binding_mismatch')
  requireCondition(['lease', 'denial', 'deactivated'].includes(result.type), 'invalid_response')
  requireCondition(
    Number.isSafeInteger(result.decisionSequence) &&
      result.decisionSequence > 0 &&
      Number.isSafeInteger(result.issuedAt) &&
      Number.isSafeInteger(result.revision),
    'invalid_response',
  )
  const previous = state.lastResponse || state.denial || state.lease
  if (previous) {
    const old = verifyEnvelope(previous, issuerKeys, domains.license)
    requireCondition(result.activationId === old.activationId, 'activation_changed_reset_required')
    if (digest(envelope) === digest(previous)) return state
    requireCondition(
      result.revision >= old.revision && result.issuedAt >= old.issuedAt && result.decisionSequence > old.decisionSequence,
      'response_rollback',
    )
  }
  let denial = state.denial || null
  if (result.type === 'lease') denial = null
  else {
    const current = state.lease && verifyEnvelope(state.lease, issuerKeys, domains.license)
    if (
      result.type === 'deactivated' ||
      ['revoked', 'activation_inactive'].includes(result.reason) ||
      !current ||
      current.releaseId === result.releaseId
    )
      denial = envelope
  }
  return {
    ...state,
    lastSignedAt: Math.max(state.lastSignedAt || 0, result.issuedAt),
    activationId: result.activationId,
    lastResponse: envelope,
    denial,
    ...(result.type === 'lease' ? { lease: envelope } : {}),
  }
}

module.exports = {
  ARTIFACT_FILE,
  LicenseError,
  domains,
  canonical,
  signedBytes,
  sha256,
  digest,
  keyFingerprint,
  validateCustomerTrust,
  verifyEnvelope,
  signRequest,
  verifyRequest,
  normalizeOrigin,
  safeFileName,
  distributableFile,
  inventory,
  verifyArtifact,
  verifyManifest,
  verifyLease,
  admitExtension,
  newInstallation,
  newRuntime,
  runtimeRequest,
  cacheRuntimeResponse,
  requireRuntime,
  closeRuntime,
  runtimeRemaining,
  saveState,
  licensingRequest,
  downloadRelease,
  cacheResponse,
  requireCondition,
}
