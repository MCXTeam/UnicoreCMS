import { createRequire } from 'module'
import path from 'path'
import { runNode } from 'unicore-common/build'

const require = createRequire(import.meta.url)

const nuxt = path.join(path.dirname(require.resolve('nuxt/package.json')), 'bin', 'nuxt.mjs')

await runNode([nuxt, 'build'])
