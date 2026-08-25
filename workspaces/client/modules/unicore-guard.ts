import { defineNuxtModule } from '@nuxt/kit'
import { projectRoot } from 'unicore-common/ports'
import { guardLayers } from 'unicore-api/nuxt'

export default defineNuxtModule({
  meta: { name: 'unicore-guard' },
  setup(_options, nuxt) {
    guardLayers(nuxt, projectRoot)
  },
})
