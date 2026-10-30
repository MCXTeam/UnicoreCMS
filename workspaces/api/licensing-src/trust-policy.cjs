const crypto = require('node:crypto')

module.exports = function createTrustPolicy(LicenseError = Error) {
  const requireCondition = (value, code = 'invalid_document') => {
    if (!value) throw new LicenseError(code)
  }
  function keyFingerprint(publicKey) {
    const key = crypto.createPublicKey(publicKey)
    requireCondition(key.asymmetricKeyType === 'ed25519', 'unsupported_key')
    return crypto
      .createHash('sha256')
      .update(key.export({ type: 'spki', format: 'der' }))
      .digest('hex')
  }

  function normalizeOrigin(value, allowLocal = false) {
    requireCondition(typeof value === 'string' && value.length < 300, 'invalid_origin')
    let url
    try {
      url = new URL(value)
    } catch {
      throw new LicenseError('invalid_origin')
    }
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    requireCondition(url.protocol === 'https:' || (allowLocal && local && url.protocol === 'http:'), 'https_required')
    requireCondition(!url.username && !url.password && url.pathname === '/' && !url.search && !url.hash, 'invalid_origin')
    requireCondition(!url.hostname.endsWith('.'), 'invalid_origin')
    return url.origin
  }

  function validateCustomerTrust(input, { allowLocalTest = false } = {}) {
    requireCondition(input && typeof input === 'object' && !Array.isArray(input), 'invalid_trust')
    const server = normalizeOrigin(input.server, allowLocalTest)
    const publicKeys = (value) => {
      requireCondition(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0, 'public_keys_required')
      const output = Object.create(null)
      for (const [kid, pem] of Object.entries(value)) {
        requireCondition(
          /^[A-Za-z0-9_-]{1,80}$/.test(kid) &&
            typeof pem === 'string' &&
            pem.includes('-----BEGIN PUBLIC KEY-----') &&
            !pem.includes('PRIVATE KEY'),
          'public_key_required',
        )
        const key = crypto.createPublicKey(pem)
        requireCondition(key.asymmetricKeyType === 'ed25519', 'unsupported_key')
        output[kid] = key.export({ type: 'spki', format: 'pem' })
      }
      return output
    }
    const issuerKeys = publicKeys(input.issuerKeys),
      publisherKeys = publicKeys(input.publisherKeys)
    const issuers = new Set(Object.values(issuerKeys).map(keyFingerprint))
    requireCondition(
      Object.values(publisherKeys).every((key) => !issuers.has(keyFingerprint(key))),
      'separate_signing_keys_required',
    )
    requireCondition(
      input.catalog && typeof input.catalog === 'object' && !Array.isArray(input.catalog) && Object.keys(input.catalog).length > 0,
      'trusted_catalog_required',
    )
    const catalog = Object.create(null),
      products = new Set()
    for (const [key, product] of Object.entries(input.catalog)) {
      requireCondition(
        /^(module|theme):[a-z][a-z0-9_]{2,31}$/.test(key) && typeof product === 'string' && /^[a-z][a-z0-9._-]{2,100}$/.test(product),
        'invalid_product',
      )
      const binding = key.split(':')[0] + ':' + product
      requireCondition(!products.has(binding), 'duplicate_product_binding')
      products.add(binding)
      catalog[key] = product
    }
    return { server, issuerKeys, publisherKeys, catalog, allowLocal: allowLocalTest }
  }

  return { keyFingerprint, normalizeOrigin, validateCustomerTrust }
}
