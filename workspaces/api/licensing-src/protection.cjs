const crypto = require('node:crypto')
const { LicenseError } = require('./errors.cjs')

const fail = (ok, code) => {
  if (!ok) throw new LicenseError(code)
}
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
function bytes(value, size) {
  fail(typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value) && value.length < 2048, 'invalid_encrypted_field')
  const result = Buffer.from(value, 'base64url')
  fail(result.toString('base64url') === value && (size === undefined || result.length === size), 'invalid_encrypted_field')
  return result
}
function keyObject(value, privateKey = false) {
  const key = privateKey ? crypto.createPrivateKey(value) : crypto.createPublicKey(value)
  fail(key.asymmetricKeyType === 'x25519', 'invalid_delivery_key')
  return key
}
function fingerprint(value) {
  return hash(keyObject(value).export({ type: 'spki', format: 'der' }))
}
function newRecipient() {
  const pair = crypto.generateKeyPairSync('x25519')
  const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' })
  return { privateKey: pair.privateKey.export({ type: 'pkcs8', format: 'pem' }), publicKey, fingerprint: fingerprint(publicKey) }
}
function artifactContext(artifact, domain = 'payload') {
  fail(
    artifact.kind === 'module' &&
      typeof artifact.releaseId === 'string' &&
      typeof artifact.productId === 'string' &&
      typeof artifact.extensionId === 'string' &&
      typeof artifact.version === 'string',
    'invalid_protected_binding',
  )
  return Buffer.from(
    JSON.stringify([
      'unicore.protected.' + domain + '.v1',
      artifact.productId,
      artifact.kind,
      artifact.extensionId,
      artifact.releaseId,
      artifact.version,
      artifact.protection?.entry || artifact.entry,
    ]),
  )
}
function runtimeContext(permit) {
  return Buffer.from(
    JSON.stringify([
      'unicore.runtime-key.v1',
      ...[
        'installationId',
        'activationId',
        'licenseId',
        'runtimeId',
        'runtimeKeyFingerprint',
        'productId',
        'kind',
        'extensionId',
        'releaseId',
        'artifactDigest',
        'keyFingerprint',
        'origin',
        'issuedAt',
        'offlineUntil',
        'decisionSequence',
        'peerNonce',
        'recipientFingerprint',
      ].map((name) => permit[name]),
    ]),
  )
}
function encrypt(plain, key, aad) {
  fail(Buffer.isBuffer(key) && key.length === 32, 'invalid_content_key')
  const iv = crypto.randomBytes(12),
    cipher = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 })
  cipher.setAAD(aad)
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()])
  return { ciphertext, iv: iv.toString('base64url'), tag: cipher.getAuthTag().toString('base64url') }
}
function decrypt(ciphertext, key, envelope, aad) {
  fail(Buffer.isBuffer(key) && key.length === 32, 'invalid_content_key')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, bytes(envelope.iv, 12), { authTagLength: 16 })
  decipher.setAAD(aad)
  decipher.setAuthTag(bytes(envelope.tag, 16))
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}
function derive(privateKey, publicKey, context) {
  const shared = crypto.diffieHellman({ privateKey: keyObject(privateKey, true), publicKey: keyObject(publicKey) })
  try {
    return Buffer.from(crypto.hkdfSync('sha256', shared, Buffer.from(hash(context), 'hex'), Buffer.from('unicore.x25519-wrap.v1'), 32))
  } finally {
    shared.fill(0)
  }
}
function wrap(contentKey, publicKey, kid, context) {
  fail(typeof kid === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(kid), 'invalid_delivery_key_id')
  const ephemeral = newRecipient(),
    aad = Buffer.concat([context, Buffer.from('\0' + kid)])
  const key = derive(ephemeral.privateKey, publicKey, aad)
  try {
    const sealed = encrypt(contentKey, key, aad)
    return {
      format: 1,
      alg: 'X25519-HKDF-SHA256-A256GCM',
      kid,
      ephemeral: keyObject(ephemeral.publicKey).export({ type: 'spki', format: 'der' }).toString('base64url'),
      iv: sealed.iv,
      tag: sealed.tag,
      ciphertext: sealed.ciphertext.toString('base64url'),
    }
  } finally {
    key.fill(0)
  }
}
function unwrap(envelope, privateKey, context) {
  fail(
    envelope?.format === 1 && envelope.alg === 'X25519-HKDF-SHA256-A256GCM' && /^[A-Za-z0-9_-]{1,80}$/.test(envelope.kid),
    'invalid_key_capsule',
  )
  const publicKey = crypto
    .createPublicKey({ key: bytes(envelope.ephemeral), type: 'spki', format: 'der' })
    .export({ type: 'spki', format: 'pem' })
  const aad = Buffer.concat([context, Buffer.from('\0' + envelope.kid)]),
    key = derive(privateKey, publicKey, aad)
  try {
    return decrypt(bytes(envelope.ciphertext, 32), key, envelope, aad)
  } finally {
    key.fill(0)
  }
}
function protectCode(code, artifact, deliveryPublicKeys) {
  fail(deliveryPublicKeys && Object.keys(deliveryPublicKeys).length === 1, 'delivery_keys_required')
  const [kid, publicKey] = Object.entries(deliveryPublicKeys)[0],
    contentKey = crypto.randomBytes(32)
  try {
    const sealed = encrypt(code, contentKey, artifactContext(artifact))
    const protection = {
      format: 1,
      algorithm: 'A256GCM',
      entry: artifact.entry,
      payload: 'server/payload.ucenc',
      iv: sealed.iv,
      tag: sealed.tag,
      keyHash: hash(contentKey),
      wrappedKey: wrap(contentKey, publicKey, kid, artifactContext(artifact, 'release-key')),
    }
    return { ciphertext: sealed.ciphertext, protection }
  } finally {
    contentKey.fill(0)
  }
}
function validateProtection(artifact) {
  const value = artifact.protection
  fail(
    value?.format === 1 &&
      value.algorithm === 'A256GCM' &&
      /^server\/[A-Za-z0-9_.-]+\.(?:c?js)$/.test(value.entry) &&
      value.payload === 'server/payload.ucenc' &&
      /^[a-f0-9]{64}$/.test(value.keyHash),
    'invalid_payload_protection',
  )
  bytes(value.iv, 12)
  bytes(value.tag, 16)
  return value
}
function openReleaseKey(artifact, deliveryPrivateKeys) {
  const value = validateProtection(artifact)
  fail(deliveryPrivateKeys && Object.hasOwn(deliveryPrivateKeys, value.wrappedKey?.kid), 'delivery_private_key_unavailable')
  const key = unwrap(value.wrappedKey, deliveryPrivateKeys[value.wrappedKey.kid], artifactContext(artifact, 'release-key'))
  if (hash(key) !== value.keyHash) {
    key.fill(0)
    throw new LicenseError('content_key_mismatch')
  }
  return key
}
function openCode(ciphertext, contentKey, artifact) {
  const value = validateProtection(artifact)
  fail(hash(contentKey) === value.keyHash, 'content_key_mismatch')
  return decrypt(ciphertext, contentKey, value, artifactContext(artifact))
}
module.exports = { fingerprint, newRecipient, runtimeContext, wrap, unwrap, protectCode, validateProtection, openReleaseKey, openCode }
