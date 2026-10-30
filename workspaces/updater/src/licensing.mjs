import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { parseEnv } from 'node:util'
import { exists, optionalJson, fail } from './files.mjs'

const require = createRequire(import.meta.url)
export async function updateLicenses(config, candidate, op, container = false) {
  const empty = { env: {}, docker: [], close() {} }
  const sdk = join(candidate, 'workspaces/api/licensing')
  if (!(await exists(join(sdk, 'index.cjs')))) return empty
  const trust = require(join(sdk, 'trust.cjs'))
  const data = resolve(config.data)
  const state = await optionalJson(join(data, 'modules/state.json'), {})
  const themes = await optionalJson(join(data, 'themes/state.json'), {})
  const environment = parseEnv(await readFile(config.database.envFile, 'utf8'))
  const selectedThemes = new Set(
    [environment.UNICORE_THEME || themes.client || themes.active, environment.UNICORE_ADMIN_THEME || themes.admin].filter(Boolean),
  )
  const selected = []
  for (const [kind, folder] of [
    ['module', 'modules'],
    ['theme', 'themes'],
  ]) {
    for (const entry of await readdir(join(data, folder), { withFileTypes: true }).catch((error) =>
      error.code === 'ENOENT' ? [] : Promise.reject(error),
    )) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || op.disabled?.includes(`${folder}/${entry.name}`)) continue
      const directory = join(data, folder, entry.name),
        manifest = await optionalJson(join(directory, `${kind}.json`), null)
      if (!manifest || (kind === 'module' ? state[manifest.id]?.enabled === false : !selectedThemes.has(manifest.id))) continue
      if (trust.catalog[`${kind}:${manifest.id}`] || manifest.commercial || (await exists(join(directory, '.unicore-release.json'))))
        selected.push({ kind, id: manifest.id, directory, manifest })
    }
  }
  if (!selected.length) return empty
  const { LicenseHost } = require(join(sdk, 'index.cjs'))
  const host = new LicenseHost(data)
  try {
    await host.start()
    for (const item of selected) host.assertExtension(item)
    const ipc = join(data, '.unicore/licensing/ipc')
    const descriptor = await optionalJson(join(ipc, 'coordinator.json'), null)
    if (!descriptor || (container && descriptor.transport !== 'unix')) fail('license_update_transport_unavailable')
    return {
      env: { UNICORE_LICENSE_COORDINATOR_DIR: container ? '/run/unicore-license' : ipc, UNICORE_LICENSE_ATTACH_ONLY: '1' },
      docker: container
        ? [
            '--mount',
            `type=bind,src=${ipc},dst=/run/unicore-license,readonly`,
            '--env',
            'UNICORE_LICENSE_COORDINATOR_DIR=/run/unicore-license',
            '--env',
            'UNICORE_LICENSE_ATTACH_ONLY=1',
          ]
        : [],
      close: () => host.close(),
    }
  } catch (error) {
    host.close()
    throw Object.assign(new Error('Paid extension admission failed before update'), {
      code: 'license_update_admission_failed',
      cause: error,
    })
  }
}
