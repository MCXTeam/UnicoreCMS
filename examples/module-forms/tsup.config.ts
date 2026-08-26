import { defineConfig } from 'tsup'
import { MODULE_EXTERNALS } from 'unicore-api'

export default defineConfig({
  entry: ['server-src/index.ts'],
  outDir: 'server',
  format: ['cjs'],
  dts: false,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: 'es2021',
  external: MODULE_EXTERNALS,
})
