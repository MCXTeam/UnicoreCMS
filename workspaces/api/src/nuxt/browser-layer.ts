import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, relative, resolve } from 'path'
import { ResolvedModuleLayer, LayerSide } from './index'

export const within = (directory: string, filename: string): boolean => {
  const value = relative(resolve(directory), resolve(filename.split('?')[0]))
  return !value.startsWith('..') && !value.startsWith('/') && !/^[a-z]:/i.test(value)
}

export const browserLayer = (item: ResolvedModuleLayer, root: string, side: LayerSide): string => {
  if (item.manifest.commercial?.frontend !== 'browser') throw new Error('commercial_frontend_browser_required')
  const allowed = new Set([
    'components',
    'composables',
    'utils',
    'pages',
    'plugins',
    'assets',
    'public',
    'nuxt.config.ts',
    'nuxt.config.js',
    'nuxt.config.mjs',
    'tsconfig.json',
    'README.md',
  ])
  for (const name of readdirSync(item.path)) if (!allowed.has(name)) throw new Error(`commercial_frontend_unsupported: ${name}`)
  const walk = (directory: string) => {
    for (const name of readdirSync(directory)) {
      const filename = join(directory, name),
        stat = lstatSync(filename)
      if (stat.isSymbolicLink() || /\.server\./i.test(name)) throw new Error('commercial_frontend_server_code')
      if (stat.isDirectory()) walk(filename)
    }
  }
  walk(item.path)
  const directory = join(root, '.nuxt/unicore-browser-layers', side, item.id)
  const config = {
    srcDir: item.path,
    components: [{ path: join(item.path, 'components'), prefix: item.componentPrefix, pathPrefix: false }],
    routeRules: { [`/mod/${item.id}`]: { ssr: false }, [`/mod/${item.id}/**`]: { ssr: false } },
  }
  const source = `export default ${JSON.stringify(config)}\n`
  const filename = join(directory, 'nuxt.config.mjs')
  mkdirSync(directory, { recursive: true })
  if (!existsSync(filename) || readFileSync(filename, 'utf8') !== source) writeFileSync(filename, source)
  return directory
}
