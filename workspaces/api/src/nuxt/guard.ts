import { resolve, posix } from 'path'
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { LayerSide, resolveLayers } from './index'
import { commercialExtension, currentHost } from 'unicore-api/licensing'
import { within } from './browser-layer'

const MAX_LAYERS = 10

interface GuardComponent {
  pascalName: string
  filePath: string
  mode?: string
  island?: boolean
  _raw?: boolean
}

interface GuardPage {
  path: string
  file?: string
  children?: GuardPage[]
  mode?: string
  alias?: string | string[]
}

interface GuardHost {
  options: { ssr?: boolean; buildDir?: string }
  hook: (...args: never[]) => unknown
}

export const guardLayers = (nuxt: GuardHost, root: string): void => {
  const side: LayerSide = nuxt.options.ssr === false ? 'admin' : 'client'
  const layers = resolveLayers({ side, root })
  const owners = [...layers.moduleLayers, ...(layers.themeLayer ? [layers.themeLayer] : [])]
  const browserModules = layers.moduleLayers.filter(item => commercialExtension({ root, kind: 'module', id: item.id, directory: item.path, manifest: item.manifest }))
  const browserOwner = (filename: string) => browserModules.find(item => within(item.path, filename))
  const theme = layers.themeLayer
  const protectedTheme = theme && commercialExtension({ root, kind: 'theme', id: theme.id, directory: theme.path, manifest: theme.manifest }) ? theme : null

  if (!owners.length) return

  if (owners.length > MAX_LAYERS) console.warn(`[unicore] подключено ${owners.length} слоёв, сборка фронта заметно замедлится`)

  const owner = (filePath: string) => owners.find((item) => within(item.path, filePath))

  nuxt.hook(...(['app:resolve', (app: { plugins: { src: string; mode?: string }[] }) => {
    for (const plugin of app.plugins) if (browserOwner(plugin.src)) plugin.mode = 'client'
  }] as never[]))

  nuxt.hook(...(['vite:extendConfig', (config: { plugins?: unknown[] }, context: { isServer: boolean }) => {
    if (!context.isServer || !browserModules.length) return
    config.plugins ||= []
    config.plugins.unshift({
      name: 'unicore-commercial-browser-boundary', enforce: 'pre',
      transform(_code: string, id: string) {
        const source = browserOwner(id)
        if (!source) return
        if (id.includes('?macro=true')) return { code: '<script setup>definePageMeta({})</script><template><span /></template>', map: null }
        if (within(resolve(source.path, 'pages'), id)) {
          if (id.endsWith('.vue')) return { code: '<template><span /></template>', map: null }
          if (id.includes('?vue&type=template')) return
        }
        throw new Error(`commercial_frontend_server_import: ${id}`)
      },
    })
  }] as never[]))

  nuxt.hook(...(['nitro:config', (config: { plugins?: string[]; handlers?: { handler: string }[]; devHandlers?: { handler: unknown }[] }) => {
    for (const filename of [...(config.plugins || []), ...(config.handlers || []).map(item => item.handler)])
      if (browserOwner(filename)) throw new Error(`commercial_frontend_server_import: ${filename}`)
    if (protectedTheme) {
      const entry = (currentHost(root) || currentHost())?.entries.get(`theme:${protectedTheme.id}`)
      if (!entry?.releaseId || !entry.artifactDigest) throw new Error('runtime_online_required')
      const directory = resolve(nuxt.options.buildDir || resolve(root, '.nuxt'), 'unicore-theme-admission', side)
      const filename = resolve(directory, `${protectedTheme.id}.mjs`)
      const binding = [protectedTheme.id, entry.releaseId, entry.artifactDigest].map(value => JSON.stringify(value)).join(',')
      const source = `import licensing from 'unicore-api/licensing';export default app=>{app.hooks.hook('request',async()=>{licensing.assertThemeLicense(${binding});await licensing.currentHost().requireLive('theme',${JSON.stringify(protectedTheme.id)});licensing.assertThemeLicense(${binding})})}\n`
      mkdirSync(directory, { recursive: true })
      if (!existsSync(filename) || readFileSync(filename, 'utf8') !== source) writeFileSync(filename, source)
      config.plugins ||= []; config.plugins.unshift(filename)
    }
  }] as never[]))

  if (protectedTheme) nuxt.hook(...(['nitro:init', (nitro: { hooks: { hook: (name: string, callback: (_nitro: unknown, config: { plugins: unknown[] }) => void) => void } }) => {
    nitro.hooks.hook('rollup:before', (_nitro, config) => {
      config.plugins.unshift({ name: 'unicore-theme-license-external', resolveId(id: string) { if (id === 'unicore-api/licensing') return { id, external: true } } })
    })
  }] as never[]))

  nuxt.hook(...(['components:extend', (components: GuardComponent[]) => {
    const byName = new Map<string, string[]>()
    const registered = new Map<string, string[]>()

    for (const component of components) {
      const list = byName.get(component.pascalName) || []

      list.push(component.filePath)
      byName.set(component.pascalName, list)
    }

    for (const component of components) {
      const source = owner(component.filePath)

      if (!source) continue

      if (browserOwner(component.filePath)) { component.mode = 'client'; component.island = false; component._raw = false }

      if (component.pascalName && !component.pascalName.startsWith(source.componentPrefix || ''))
        throw new Error(
          `[unicore] компонент «${component.pascalName}» из «${source.id}» должен начинаться с префикса «${source.componentPrefix}»`,
        )

      const clashes = (byName.get(component.pascalName) || []).filter((path) => path !== component.filePath)

      for (const clash of clashes)
        if (clash.includes('primevue') || !owner(clash))
          throw new Error(`[unicore] компонент «${component.pascalName}» из «${source.id}» перекрывает существующий компонент ${clash}`)

      registered.set(source.id, [...(registered.get(source.id) || []), component.pascalName])
    }

    for (const [id, names] of registered) console.info(`[unicore] «${id}» зарегистрировал компоненты: ${names.sort().join(', ')}`)
  }] as never[]))

  const checkPages = (pages: GuardPage[]) => {
    const walk = (list: GuardPage[], parent = '/') => {
      for (const page of list) {
        const route = posix.resolve(parent, page.path)
        const source = layers.moduleLayers.find((item) => page.file && within(item.path, page.file))

        if (source && route !== `/mod/${source.id}` && !route.startsWith(`/mod/${source.id}/`))
          throw new Error(`[unicore] страница «${page.path}» из «${source.id}» должна начинаться с «/mod/${source.id}»`)

        if (source && browserOwner(page.file || '')) {
          page.mode = 'client'
          for (const alias of Array.isArray(page.alias) ? page.alias : page.alias ? [page.alias] : [])
            if (posix.resolve(parent, alias) !== `/mod/${source.id}` && !posix.resolve(parent, alias).startsWith(`/mod/${source.id}/`)) throw new Error('commercial_frontend_route_alias')
        }

        if (page.children?.length) walk(page.children, route)
      }
    }

    walk(pages)
  }
  nuxt.hook(...(['pages:resolved', checkPages] as never[]))
  nuxt.hook(...(['pages:extend', (pages: GuardPage[]) => {
    checkPages(pages)

    const theme = layers.themeLayer

    if (!theme) return

    const replace = theme.manifest.pages?.replace || {}
    const remove = theme.manifest.pages?.remove || []

    const apply = (list: GuardPage[], parent = '/') => {
      for (const page of [...list]) {
        const route = posix.resolve(parent, page.path)
        if (remove.includes(route)) {
          list.splice(list.indexOf(page), 1)
          continue
        }

        if (replace[route]) page.file = resolve(theme.path, replace[route])

        if (page.children?.length) apply(page.children, route)
      }
    }

    apply(pages)

    const known = new Set<string>()
    const collect = (list: GuardPage[], parent = '/') => {
      for (const page of list) {
        const route = posix.resolve(parent, page.path)
        known.add(route)

        if (page.children?.length) collect(page.children, route)
      }
    }

    collect(pages)

    for (const path of Object.keys(replace))
      if (!known.has(path)) console.warn(`[unicore] тема «${theme.id}» подменяет несуществующую страницу «${path}»`)
  }] as never[]))
}
