import { resolve } from 'path'
import { defineNuxtModule } from '@nuxt/kit'
import { projectRoot } from 'unicore-common/ports'
import { resolveLayers } from 'unicore-api/nuxt'

const MAX_LAYERS = 10

export default defineNuxtModule({
  meta: { name: 'unicore-guard' },
  setup(_options, nuxt) {
    const side = nuxt.options.ssr === false ? 'admin' : 'client'
    const layers = resolveLayers({ side, root: projectRoot })
    const owners = [...layers.moduleLayers, ...(layers.themeLayer ? [layers.themeLayer] : [])]

    if (!owners.length) return

    if (owners.length > MAX_LAYERS)
      console.warn(`[unicore] подключено ${owners.length} слоёв, сборка фронта заметно замедлится`)

    const owner = (filePath: string) => owners.find((item) => filePath.startsWith(item.path))

    nuxt.hook('components:extend', (components) => {
      const byName = new Map<string, string[]>()

      for (const component of components) {
        const list = byName.get(component.pascalName) || []

        list.push(component.filePath)
        byName.set(component.pascalName, list)
      }

      for (const component of components) {
        const source = owner(component.filePath)

        if (!source) continue

        if (component.pascalName && !component.pascalName.startsWith(source.componentPrefix || ''))
          throw new Error(
            `[unicore] компонент «${component.pascalName}» из «${source.id}» должен начинаться с префикса «${source.componentPrefix}»`,
          )

        const clashes = (byName.get(component.pascalName) || []).filter((path) => path !== component.filePath)

        for (const clash of clashes)
          if (clash.includes('primevue') || !owner(clash))
            throw new Error(
              `[unicore] компонент «${component.pascalName}» из «${source.id}» перекрывает существующий компонент ${clash}`,
            )
      }
    })

    nuxt.hook('pages:extend', (pages) => {
      const walk = (list: typeof pages) => {
        for (const page of list) {
          const source = layers.moduleLayers.find((item) => (page.file || '').startsWith(item.path))

          if (source && !page.path.startsWith(`/mod/${source.id}`))
            throw new Error(`[unicore] страница «${page.path}» из «${source.id}» должна начинаться с «/mod/${source.id}»`)

          if (page.children?.length) walk(page.children)
        }
      }

      walk(pages)

      const theme = layers.themeLayer

      if (!theme) return

      const replace = theme.manifest.pages?.replace || {}
      const remove = theme.manifest.pages?.remove || []

      const apply = (list: typeof pages) => {
        for (const page of [...list]) {
          if (remove.includes(page.path)) {
            list.splice(list.indexOf(page), 1)
            continue
          }

          if (replace[page.path]) page.file = resolve(theme.path, replace[page.path])

          if (page.children?.length) apply(page.children)
        }
      }

      apply(pages)

      const known = new Set<string>()
      const collect = (list: typeof pages) => {
        for (const page of list) {
          known.add(page.path)

          if (page.children?.length) collect(page.children)
        }
      }

      collect(pages)

      for (const path of Object.keys(replace))
        if (!known.has(path)) console.warn(`[unicore] тема «${theme.id}» подменяет несуществующую страницу «${path}»`)
    })
  },
})
