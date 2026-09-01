import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { join, relative, resolve, sep } from 'path'

const root = resolve(import.meta.dirname, '..')
const dist = join(root, 'dist')
const report = join(root, 'api-report.d.txt')

const files = []

const walk = (dir) => {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)

    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.d.ts')) files.push(path)
  }
}

walk(dist)

const snapshot = files
  .map((file) => {
    const body = readFileSync(file, 'utf-8')
      .split('\n')
      .filter((line) => !line.startsWith('//') && !line.startsWith('/*') && line.trim())
      .join('\n')

    return `=== ${relative(dist, file).split(sep).join('/')} ===\n${body}`
  })
  .join('\n\n')

if (process.argv.includes('--write')) {
  writeFileSync(report, `${snapshot}\n`, 'utf-8')
  console.log(`Снапшот публичного API обновлён: ${relative(root, report)}`)
  process.exit(0)
}

let previous = ''

try {
  previous = readFileSync(report, 'utf-8').trimEnd()
} catch {
  console.error('Снапшот публичного API не найден. Создайте его: pnpm --filter unicore-api run api:snapshot')
  process.exit(1)
}

if (previous === snapshot.trimEnd()) {
  console.log('Публичный API совпадает со снапшотом')
  process.exit(0)
}

console.error('Публичный API изменился. Проверьте совместимость и обновите снапшот: pnpm --filter unicore-api run api:snapshot')
process.exit(1)
