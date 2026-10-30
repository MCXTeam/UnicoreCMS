import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { join, resolve } from 'path'
import { satisfies } from 'semver'
import { API_VERSION } from '../version'
import { ModuleManifest, ThemeManifest, validateModuleManifest, validateThemeManifest } from '../manifest'
import { assertExtension, commercialExtension } from 'unicore-api/licensing'
import { browserLayer } from './browser-layer'

export type LayerSide = 'client' | 'admin'

export interface ResolvedModuleLayer {
  id: string
  path: string
  componentPrefix: string
  manifest: ModuleManifest
}

export interface ResolvedThemeLayer {
  id: string
  path: string
  componentPrefix: string
  manifest: ThemeManifest
}

export interface ResolvedLayers {
  modules: string[]
  theme: string[]
  moduleLayers: ResolvedModuleLayer[]
  themeLayer: ResolvedThemeLayer | null
  enabledIds: string[]
  themeId: string | null
  problems: string[]
}

export interface ResolveLayersOptions {
  side: LayerSide
  root?: string
  theme?: string | null
}

const readJson = (path: string): unknown => {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

const readState = (root: string): Record<string, { enabled?: boolean }> => {
  const state = readJson(join(root, 'modules', 'state.json'))

  return state && typeof state === 'object' ? (state as Record<string, { enabled?: boolean }>) : {}
}

const readActiveTheme = (root: string, side: LayerSide): string | null => {
  const state = readJson(join(root, 'themes', 'state.json'))

  if (!state || typeof state !== 'object') return null

  const value = (state as Record<string, unknown>)[side]

  if (typeof value === 'string' && value) return value

  const legacy = (state as { active?: unknown }).active

  return side === 'client' && typeof legacy === 'string' && legacy ? legacy : null
}

const themeFromEnv = (side: LayerSide): string | null =>
  (side === 'admin' ? process.env.UNICORE_ADMIN_THEME : process.env.UNICORE_THEME) || null

const directories = (path: string): string[] => {
  if (!existsSync(path)) return []

  return readdirSync(path)
    .filter((name) => !name.startsWith('.'))
    .map((name) => join(path, name))
    .filter((item) => statSync(item).isDirectory())
}

const themeDirectory = (root: string, id: string): { dir: string; raw: unknown } | null => {
  const exact = join(root, 'themes', id)
  const direct = readJson(join(exact, 'theme.json'))

  if (direct) return { dir: exact, raw: direct }

  for (const dir of directories(join(root, 'themes'))) {
    const raw = readJson(join(dir, 'theme.json'))

    if (raw && (raw as { id?: string }).id === id) return { dir, raw }
  }

  return null
}

export const resolveLayers = (options: ResolveLayersOptions): ResolvedLayers => {
  const root = options.root || process.cwd()
  const state = readState(root)
  const problems: string[] = []

  const moduleLayers: ResolvedModuleLayer[] = []
  const modulePaths = new Map<string, string>()
  const candidates = new Map<string, { dir: string; manifest: ModuleManifest }>()

  for (const dir of directories(join(root, 'modules'))) {
    const raw = readJson(join(dir, 'module.json'))
    if (!raw) continue

    const { manifest, errors } = validateModuleManifest(raw)

    if (!manifest) {
      problems.push(`modules/${dir.split('/').pop()}: ${errors.join('; ')}`)
      continue
    }

    if (state[manifest.id]?.enabled === false) continue

    if (candidates.has(manifest.id)) throw new Error(`duplicate_module_id: ${manifest.id}`)
    candidates.set(manifest.id, { dir, manifest })
  }

  const admitted = new Set<string>()
  const rejected = new Set<string>()
  const visiting = new Set<string>()
  const visit = (id: string): boolean => {
    if (admitted.has(id)) return true
    if (rejected.has(id)) return false
    const item = candidates.get(id)
    if (!item || visiting.has(id)) return false
    const { dir, manifest } = item
    visiting.add(id)

    try {
      assertExtension({ root, kind: 'module', id: manifest.id, directory: dir, manifest })

      if (!satisfies(API_VERSION, manifest.unicoreApi))
        throw new Error(`требует API ${manifest.unicoreApi}, установлен ${API_VERSION}`)

      for (const [dependencyId, range] of Object.entries(manifest.requires?.modules || {})) {
        const dependency = candidates.get(dependencyId)
        if (!dependency || !satisfies(dependency.manifest.version, range) || !visit(dependencyId))
          throw new Error(`Недоступна зависимость «${dependencyId}» ${range}`)
      }

      const layer = manifest[options.side]
      if (layer) {
        const path = resolve(dir, layer)
        if (!existsSync(path)) throw new Error(`слой ${options.side} не найден по пути ${layer}`)
        const item = { id: manifest.id, path, componentPrefix: manifest.componentPrefix || '', manifest }
        const commercial = commercialExtension({ root, kind: 'module', id, directory: dir, manifest })
        modulePaths.set(id, commercial ? browserLayer(item, root, options.side) : path)
        moduleLayers.push(item)
      }

      admitted.add(id)
      return true
    } catch (error) {
      rejected.add(id)
      problems.push(`Модуль «${id}»: ${error instanceof Error ? error.message : 'extension_license_required'}`)
      return false
    } finally {
      visiting.delete(id)
    }
  }
  for (const id of candidates.keys()) visit(id)

  const requestedTheme = process.env.UNICORE_THEME_FALLBACK_BUILD === '1' ? null :
    options.theme === undefined ? themeFromEnv(options.side) || readActiveTheme(root, options.side) : options.theme
  let themeLayer: ResolvedThemeLayer | null = null

  if (requestedTheme) {
    const found = themeDirectory(root, requestedTheme)

    if (!found) problems.push(`Тема «${requestedTheme}» не найдена в themes/`)
    else {
      const { manifest, errors } = validateThemeManifest(found.raw)

      if (!manifest) problems.push(`themes/${requestedTheme}: ${errors.join('; ')}`)
      else if (!satisfies(API_VERSION, manifest.unicoreApi))
        problems.push(`Тема «${manifest.id}» требует API ${manifest.unicoreApi}, установлен ${API_VERSION}`)
      else if ((manifest.side || 'client') !== options.side) themeLayer = null
      else {
        try {
          assertExtension({ root, kind: 'theme', id: manifest.id, directory: found.dir, manifest })
          themeLayer = { id: manifest.id, path: found.dir, componentPrefix: manifest.componentPrefix || 'Theme', manifest }
        } catch { problems.push(`Тема «${manifest.id}»: extension_license_required`) }
      }
    }
  }

  return {
    modules: moduleLayers.map((item) => modulePaths.get(item.id)!),
    theme: themeLayer ? [themeLayer.path] : [],
    moduleLayers,
    themeLayer,
    enabledIds: moduleLayers.map((item) => item.id),
    themeId: themeLayer?.id || null,
    problems,
  }
}

export * from './guard'
