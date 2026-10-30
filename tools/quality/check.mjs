import { execFileSync } from 'node:child_process'
import { readFile, access } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { ESLint } from 'eslint'
import prettier from 'prettier'

const root = resolve(import.meta.dirname, '../..')
const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
    .split('\0')
    .filter(Boolean)
const scope = JSON.parse(await readFile(join(root, '.quality-scope.json'), 'utf8'))
const base = process.env.QUALITY_BASE_REF?.replace(/^0{40}$/, '')
if (base && !/^[a-f0-9]{40}$/.test(base)) throw Error('QUALITY_BASE_REF must be a full commit SHA')
const comparison = base ? [base + '...HEAD'] : ['--cached']
const changed = git('diff', '--name-only', '--diff-filter=ACMR', '-z', ...comparison)
const added = new Set([
  ...git('diff', '--name-only', '--diff-filter=A', '-z', ...comparison),
  ...git('ls-files', '--others', '--exclude-standard', '-z'),
])
const sourceFile = (file) =>
  /\.(?:[cm]?[jt]s|vue)$/.test(file) &&
  !/^workspaces\/api\/licensing(?:\/|-(?:build|previous)-)/.test(file) &&
  !/^(?:docs|modules|themes)\//.test(file) &&
  !/(?:^|\/)(?:node_modules|dist|\.output|\.nuxt|\.codex)\//.test(file)
const existing = async (files) => {
  const result = []
  for (const file of new Set(files)) {
    if (file.includes('..') || file.startsWith('/') || file.includes('\\')) throw Error('Unsafe quality-check path')
    try {
      await access(join(root, file))
      result.push(file)
    } catch {}
  }
  return result.sort()
}
const mode = process.argv[2]
if (mode === 'lint') {
  const files = (await existing([...scope.lint, ...changed, ...added])).filter(sourceFile)
  const eslint = new ESLint({ cwd: root, overrideConfigFile: join(root, 'eslint.config.mjs') })
  const results = await eslint.lintFiles(files)
  process.stdout.write((await eslint.loadFormatter('stylish')).format(results))
  const errors = results.reduce((count, result) => count + result.errorCount, 0)
  console.log(`ESLint: ${files.length} maintained/changed source files, ${errors} errors`)
  process.exitCode = errors ? 1 : 0
} else if (mode === 'format') {
  const files = (await existing([...scope.format, ...changed, ...added])).filter((file) => sourceFile(file) || scope.format.includes(file))
  let failures = 0,
    checked = 0
  for (const file of files) {
    const filename = join(root, file)
    const formatter = file.startsWith('workspaces/server/') ? createRequire(filename)('prettier') : prettier
    const options = { ...(await formatter.resolveConfig(filename)), filepath: filename }
    if (!scope.format.includes(file) && !added.has(file)) {
      let previous
      try {
        previous = execFileSync('git', ['show', `${base || 'HEAD'}:${file}`], {
          cwd: root,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        })
      } catch {}
      if (previous !== undefined && !(await formatter.check(previous, options))) {
        console.log(`Legacy formatting outside maintained scope: ${file}`)
        continue
      }
    }
    checked++
    if (!(await formatter.check(await readFile(filename, 'utf8'), options))) {
      console.error(`Formatting: ${file}`)
      failures++
    }
  }
  console.log(`Prettier: ${checked} maintained/new/formatted source files, ${failures} failures`)
  process.exitCode = failures ? 1 : 0
} else throw Error('Use lint or format')
