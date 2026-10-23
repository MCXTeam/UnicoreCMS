import { createRequire } from 'module'
import path from 'path'
import { runNode } from 'unicore-common/build'
import { projectRoot } from 'unicore-common/ports'
import { portableNitro } from '../../scripts/portable-nitro.mjs'

const require = createRequire(import.meta.url)

const nuxt = path.join(path.dirname(require.resolve('nuxt/package.json')), 'bin', 'nuxt.mjs')

await runNode([nuxt, 'build'])
await portableNitro(path.resolve('.output/server'), projectRoot)
