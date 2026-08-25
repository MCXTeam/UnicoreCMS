import { resolve } from 'path'
import { LayerSide, resolveLayers } from './index'

const MAX_LAYERS = 10

interface GuardComponent {
  pascalName: string
  filePath: string
}

interface GuardPage {
  path: string
  file?: string
  children?: GuardPage[]
}

interface GuardHost {
  options: { ssr?: boolean }
  hook: (...args: never[]) => unknown
}

export const guardLayers = (nuxt: GuardHost, root: string): void => {
  const side: LayerSide = nuxt.options.ssr === false ? 'admin' : 'client'
  const layers = resolveLayers({ side, root })
  const owners = [...layers.moduleLayers, ...(layers.themeLayer ? [layers.themeLayer] : [])]

  if (!owners.length) return

  if (owners.length > MAX_LAYERS) console.warn(`[unicore] подключено ${owners.length} слоёв, сборка фронта заметно замедлится`)

  const owner = (filePath: string) => owners.find((item) => filePath.startsWith(item.path))

  nuxt.hook(...(['components:extend', (components: GuardComponent[]) => {
    const byName = new Map<string, string[]>()
    const registered = new Map<string, string[]>()

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
          throw new Error(`[unicore] компонент «${component.pascalName}» из «${source.id}» перекрывает существующий компонент ${clash}`)

      registered.set(source.id, [...(registered.get(source.id) || []), component.pascalName])
    }

    for (const [id, names] of registered) console.info(`[unicore] «${id}» зарегистрировал компоненты: ${names.sort().join(', ')}`)
  }] as never[]))

  nuxt.hook(...(['pages:extend', (pages: GuardPage[]) => {
    const walk = (list: GuardPage[]) => {
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

    const apply = (list: GuardPage[]) => {
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
    const collect = (list: GuardPage[]) => {
      for (const page of list) {
        known.add(page.path)

        if (page.children?.length) collect(page.children)
      }
    }

    collect(pages)

    for (const path of Object.keys(replace))
      if (!known.has(path)) console.warn(`[unicore] тема «${theme.id}» подменяет несуществующую страницу «${path}»`)
  }] as never[]))
}
