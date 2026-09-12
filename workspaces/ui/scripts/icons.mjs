import { readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const svg = resolve(here, '..', '..', '..', 'node_modules', 'boxicons', 'svg')

const names = ['regular', 'solid', 'logos']
  .flatMap((folder) => readdirSync(resolve(svg, folder)))
  .filter((file) => file.endsWith('.svg'))
  .map((file) => file.replace('.svg', ''))
  .sort()

const body = names.map((name) => `  '${name}',`).join('\n')

writeFileSync(
  resolve(here, '..', 'icons.ts'),
  `export const BOXICONS: string[] = [\n${body}\n]\n`,
  'utf8',
)

console.log(`иконок сохранено: ${names.length}`)
