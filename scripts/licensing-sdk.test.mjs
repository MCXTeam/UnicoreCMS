import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { configuredTrust, validateLicensingTrust, packageLicensingSdk, verifyLicensingSdk } from './licensing-sdk.mjs'
import { managed } from '../workspaces/updater/src/files.mjs'

const require = createRequire(import.meta.url)
const client = require('../workspaces/api/licensing-src/sdk.cjs')
test('build and runtime agree on public trust and reject invalid endpoints and private signing material', () => {
  const trust = configuredTrust()
  assert.deepEqual(
    JSON.parse(JSON.stringify(validateLicensingTrust(trust))),
    JSON.parse(JSON.stringify(client.validateCustomerTrust(trust))),
  )
  for (const server of [
    'https://license.unicorecms.ru.',
    'http://license.unicorecms.ru',
    'https://user@license.unicorecms.ru',
    'https://license.unicorecms.ru/api',
    'https://license.unicorecms.ru?q=1',
    'https://license.unicorecms.ru#x',
  ]) {
    assert.throws(() => validateLicensingTrust({ ...trust, server }))
    assert.throws(() => client.validateCustomerTrust({ ...trust, server }))
  }
  for (const keys of ['issuerKeys', 'publisherKeys'])
    assert.throws(() => validateLicensingTrust({ ...trust, [keys]: { bad: '-----BEGIN PRIVATE KEY-----' } }))
})
test('customer SDK seals transformed code and rejects corruption or changed trust', () => {
  const root = mkdtempSync(join(tmpdir(), 'unicore-sdk-build-')),
    output = join(root, 'licensing'),
    trust = configuredTrust()
  try {
    packageLicensingSdk({ output, trust })
    verifyLicensingSdk({ directory: output, trust })
    assert(!existsSync(join(output, 'index.cjs.map')))
    assert.notEqual(
      readFileSync(join(output, 'host.cjs'), 'utf8'),
      readFileSync(new URL('../workspaces/api/licensing-src/index.cjs', import.meta.url), 'utf8'),
    )
    const host = join(output, 'host.cjs'),
      original = readFileSync(host)
    writeFileSync(host, Buffer.concat([original, Buffer.from('\nexports.bypass=true')]))
    assert.throws(() => verifyLicensingSdk({ directory: output, trust }), /licensing_sdk_file_mismatch/)
    writeFileSync(host, original)
    assert.throws(
      () => verifyLicensingSdk({ directory: output, trust: { ...trust, server: 'https://another.example' } }),
      /licensing_sdk_trust_mismatch/,
    )
    assert.equal(managed('workspaces/api/licensing-src/index.cjs'), false)
    assert.equal(managed('workspaces/api/licensing/index.cjs'), true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
