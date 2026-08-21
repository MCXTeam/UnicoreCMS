import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const themeDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  components: [{ path: resolve(themeDir, 'components'), prefix: 'Theme', pathPrefix: false }],
  css: [resolve(themeDir, 'assets/tokens.scss')],
})
