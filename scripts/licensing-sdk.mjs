import createTrustPolicy from './licensing-policy.cjs'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, lstatSync, renameSync, rmSync, copyFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = resolve(import.meta.dirname, '..')
const source = join(root, 'workspaces/api/licensing-src')
const destination = join(root, 'workspaces/api/licensing')
const checksum = (value) => createHash('sha256').update(value).digest('hex')
const ensure = (value, code) => {
  if (!value) throw Error(code)
}
export const validateLicensingTrust = createTrustPolicy().validateCustomerTrust
export function configuredTrust(base = root) {
  return validateLicensingTrust(JSON.parse(readFileSync(join(base, 'compat/licensing.json'), 'utf8')))
}
const trustCode = (value) => 'module.exports=Object.freeze(' + JSON.stringify(value) + ')\n'
export function verifyLicensingSdk({ directory = destination, trust = configuredTrust(), allowLocalTest = false } = {}) {
  const expected = validateLicensingTrust(trust, { allowLocalTest })
  const metaFile = join(directory, 'sdk-build.json')
  ensure(existsSync(metaFile) && !lstatSync(metaFile).isSymbolicLink(), 'licensing_sdk_not_built')
  const meta = JSON.parse(readFileSync(metaFile, 'utf8'))
  ensure(
    meta.format === 1 && meta.trust === checksum(trustCode(expected)) && meta.files && Object.keys(meta.files).length >= 8,
    'licensing_sdk_trust_mismatch',
  )
  const files = readdirSync(directory)
    .filter((name) => name !== 'sdk-build.json')
    .sort()
  ensure(JSON.stringify(files) === JSON.stringify(Object.keys(meta.files).sort()), 'licensing_sdk_inventory_mismatch')
  for (const name of files) {
    ensure(/^[a-z][a-z0-9-]*(?:\.cjs|\.d\.cts)$/.test(name), 'licensing_sdk_private_file')
    const filename = join(directory, name)
    ensure(
      lstatSync(filename).isFile() && !lstatSync(filename).isSymbolicLink() && checksum(readFileSync(filename)) === meta.files[name],
      'licensing_sdk_file_mismatch',
    )
  }
  ensure(readFileSync(join(directory, 'trust.cjs'), 'utf8') === trustCode(expected), 'licensing_sdk_trust_mismatch')
  return meta
}
export function packageLicensingSdk({ output, trust = configuredTrust(), sourceDirectory = source, allowLocalTest = false } = {}) {
  output = resolve(output)
  ensure(!existsSync(output), 'sdk_output_exists')
  const value = validateLicensingTrust(trust, { allowLocalTest })
  const require = createRequire(join(root, 'workspaces/server/package.json'))
  const obfuscator = require('javascript-obfuscator')
  const options = {
    ...obfuscator.getOptionsByPreset('medium-obfuscation'),
    target: 'node',
    sourceMap: false,
    renameProperties: false,
    renameGlobals: false,
    transformObjectKeys: false,
    disableConsoleOutput: false,
    debugProtection: false,
    debugProtectionInterval: 0,
    seed: 417,
  }
  mkdirSync(output, { recursive: true })
  for (const name of readdirSync(sourceDirectory).filter((name) => name.endsWith('.cjs') && name !== 'trust.cjs')) {
    const filename = join(sourceDirectory, name)
    ensure(lstatSync(filename).isFile() && !lstatSync(filename).isSymbolicLink(), 'licensing_sdk_source_symlink')
    writeFileSync(
      join(output, name === 'index.cjs' ? 'host.cjs' : name),
      obfuscator.obfuscate(readFileSync(filename, 'utf8'), options).getObfuscatedCode(),
    )
  }
  const names = Object.keys(require(join(sourceDirectory, 'index.cjs')))
  writeFileSync(
    join(output, 'index.cjs'),
    "const host=require('./host.cjs')\n" + names.map((name) => `exports.${name}=host.${name}\n`).join(''),
  )
  writeFileSync(join(output, 'trust.cjs'), trustCode(value))
  copyFileSync(join(sourceDirectory, 'index.d.cts'), join(output, 'index.d.cts'))
  const files = Object.fromEntries(
    readdirSync(output)
      .sort()
      .map((name) => [name, checksum(readFileSync(join(output, name)))]),
  )
  writeFileSync(join(output, 'sdk-build.json'), JSON.stringify({ format: 1, trust: checksum(trustCode(value)), files }, null, 2) + '\n')
  verifyLicensingSdk({ directory: output, trust: value, allowLocalTest })
  return { output, products: Object.keys(value.catalog), protected: true }
}
export function buildLicensingSdk() {
  if (!existsSync(join(source, 'index.cjs'))) return verifyLicensingSdk()
  const staging = destination + '-build-' + randomUUID(),
    previous = destination + '-previous-' + randomUUID()
  let backedUp = false
  try {
    packageLicensingSdk({ output: staging })
    if (existsSync(destination)) {
      renameSync(destination, previous)
      backedUp = true
    }
    try {
      renameSync(staging, destination)
    } catch (error) {
      if (backedUp) renameSync(previous, destination)
      throw error
    }
    if (backedUp) rmSync(previous, { recursive: true, force: true })
  } finally {
    rmSync(staging, { recursive: true, force: true })
  }
  return verifyLicensingSdk()
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) verifyLicensingSdk()
  else buildLicensingSdk()
  console.log('Licensing SDK: protected, public trust verified')
}
