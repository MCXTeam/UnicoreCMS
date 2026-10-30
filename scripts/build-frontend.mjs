import { createRequire } from 'node:module'
import { mkdir, rename, rm, writeFile, readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { prepareLicenses, commercialExtension } from 'unicore-api/licensing'
import { resolveLayers } from 'unicore-api/nuxt'
import { portableNitro } from './portable-nitro.mjs'
import ts from 'typescript'

const inside = (workspace, filename) => {
  const resolved = resolve(workspace, filename),
    local = relative(workspace, resolved)
  if (!local || local.startsWith('..')) throw new Error('invalid_frontend_output')
  return resolved
}

async function protectThemeServer(directory, theme) {
  const binding = [theme.id, theme.releaseId, theme.artifactDigest].map((value) => JSON.stringify(value)).join(',')
  await rename(join(directory, 'index.mjs'), join(directory, 'runtime.mjs'))
  const walk = async (folder) => {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const filename = join(folder, entry.name)
      if (entry.isDirectory() && entry.name !== 'node_modules') await walk(filename)
      else if (entry.isFile() && /\.[cm]?js$/.test(entry.name)) {
        const guard = entry.name.endsWith('.cjs')
          ? `require('unicore-api/licensing').assertThemeLicense(${binding});\n`
          : `import __unicoreThemeAdmission from 'unicore-api/licensing';__unicoreThemeAdmission.assertThemeLicense(${binding});\n`
        const source = await readFile(filename, 'utf8')
        let offset = source.startsWith('#!') ? source.indexOf('\n') + 1 : 0
        for (const statement of ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS).statements) {
          if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break
          offset = statement.end
        }
        await writeFile(filename, source.slice(0, offset) + '\n' + guard + source.slice(offset))
      }
    }
  }
  await walk(directory)
  await writeFile(
    join(directory, 'index.mjs'),
    `import licensing from 'unicore-api/licensing';import {dataRoot,loadPublicEnvFile} from 'unicore-common/ports';loadPublicEnvFile();const host=await licensing.prepareLicenses(dataRoot);licensing.assertThemeLicense(${binding});host.onBlocked(key=>{if(key===${JSON.stringify('theme:' + theme.id)})process.exit(1)});setInterval(()=>{try{licensing.assertThemeLicense(${binding})}catch{process.exit(1)}},1000).unref();await import('./runtime.mjs');\n`,
  )
}

export async function buildFrontend(workspace, side, options = {}) {
  workspace = resolve(workspace)
  const require = createRequire(join(workspace, 'package.json'))
  const runNode = options.runNode || require('unicore-common/build').runNode
  const { dataRoot, projectRoot } = options.paths || require('unicore-common/ports')
  const nuxt = join(dirname(require.resolve('nuxt/package.json')), 'bin/nuxt.mjs')
  const host = await prepareLicenses(dataRoot)
  const layers = resolveLayers({ root: dataRoot, side })
  const theme = layers.themeLayer
  const licensedTheme = theme && commercialExtension({ kind: 'theme', id: theme.id, directory: theme.path, manifest: theme.manifest })
  const modules = layers.moduleLayers
    .filter((item) => commercialExtension({ kind: 'module', id: item.id, directory: item.path, manifest: item.manifest }))
    .map((item) => item.id)
  const output = inside(workspace, '.output')
  const primary = inside(workspace, `.output-primary-${process.pid}`)
  const fallback = inside(workspace, `.output-fallback-${process.pid}`)
  const backup = inside(workspace, `.output-previous-${process.pid}`)
  const existed = existsSync(output)
  if ([primary, fallback, backup].some(existsSync)) throw new Error('frontend_staging_exists')
  if (existed) await rename(output, backup)
  try {
    await runNode([nuxt, 'build'], workspace)
    if (!licensedTheme && !modules.length) await portableNitro(join(output, 'server'), projectRoot)
    else {
      if (licensedTheme) {
        await rename(output, primary)
        const previous = process.env.UNICORE_THEME_FALLBACK_BUILD
        try {
          process.env.UNICORE_THEME_FALLBACK_BUILD = '1'
          await runNode([nuxt, 'build'], workspace)
          await rename(output, fallback)
        } finally {
          if (previous === undefined) delete process.env.UNICORE_THEME_FALLBACK_BUILD
          else process.env.UNICORE_THEME_FALLBACK_BUILD = previous
        }
        await mkdir(output)
        await rename(primary, join(output, 'primary'))
        await rename(fallback, join(output, 'fallback'))
        await mkdir(join(output, 'server'))
        await portableNitro(join(output, 'primary/server'), projectRoot)
        await portableNitro(join(output, 'fallback/server'), projectRoot)
      } else {
        await rename(join(output, 'server/index.mjs'), join(output, 'server/runtime.mjs'))
        await portableNitro(join(output, 'server'), projectRoot)
      }
      const entry = theme && host.entries.get(`theme:${theme.id}`)
      const metadata = {
        schema: 1,
        side,
        modules,
        browserOnly: true,
        moduleBindings: Object.fromEntries(
          modules.map((id) => {
            const item = host.entries.get(`module:${id}`)
            return [id, { releaseId: item?.releaseId, artifactDigest: item?.artifactDigest }]
          }),
        ),
        theme: licensedTheme ? { id: theme.id, releaseId: entry?.releaseId, artifactDigest: entry?.artifactDigest } : null,
      }
      if (metadata.theme) await protectThemeServer(join(output, 'primary/server'), metadata.theme)
      await writeFile(join(output, 'licensing.json'), JSON.stringify(metadata))
      await writeFile(join(output, 'server/index.mjs'), 'await import("../../start.mjs")\n')
    }
  } catch (error) {
    await rm(output, { recursive: true, force: true })
    if (existed) await rename(backup, output)
    throw error
  } finally {
    for (const staging of [primary, fallback]) await rm(staging, { recursive: true, force: true })
  }
  if (existed) await rm(backup, { recursive: true, force: true })
}
