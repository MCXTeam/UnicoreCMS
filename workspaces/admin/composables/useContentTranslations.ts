import { TRANSLATABLE_FIELDS, type TranslatableField } from '~/constants/translatable'
import { useDefaultLocale, useLocales } from '~/composables/useLocale'

export type TranslationsMap = Record<string, Record<string, string>>

function read(target: Record<string, any> | null, path: string) {
  return path.split('.').reduce<any>((node, key) => (node == null ? node : node[key]), target)
}

function write(target: Record<string, any> | null, path: string, value: any) {
  const parts = path.split('.')
  const last = parts.pop() as string
  let node: any = target

  for (const part of parts) {
    if (node == null) return
    node = node[part]
  }

  if (node) node[last] = value
}

export function useContentTranslations(entity: string) {
  const { $api } = useNuxtApp()
  const locales = useLocales()
  const defaultLocale = useDefaultLocale()
  const spec = TRANSLATABLE_FIELDS[entity] || []

  const locale = ref(defaultLocale.value)
  const map = ref<TranslationsMap>({})
  const source = ref<Record<string, any> | null>(null)

  const isDefault = computed(() => locale.value === defaultLocale.value)

  const fields = markRaw(
    new Proxy({} as Record<string, any>, {
      get(_target, key: string) {
        if (isDefault.value) return read(source.value, key)

        return map.value[locale.value]?.[key] ?? ''
      },
      set(_target, key: string, value: any) {
        if (isDefault.value) write(source.value, key, value)
        else map.value = { ...map.value, [locale.value]: { ...(map.value[locale.value] || {}), [key]: value } }

        return true
      },
    }),
  )

  function expand(target: Record<string, any> | null): TranslatableField[] {
    return spec.flatMap((field) => {
      if (!field.path.includes('*')) return field

      const [prefix] = field.path.split('.*.')
      const list = read(target, prefix)

      if (!Array.isArray(list)) return []

      return list.map((_item, index) => ({ ...field, path: field.path.replace('*', String(index)), row: index + 1 }))
    })
  }

  const visible = computed(() => expand(source.value))

  const status = computed(() => {
    const all = visible.value

    return locales.value.reduce<Record<string, number>>((result, item) => {
      if (item.code === defaultLocale.value) {
        result[item.code] = 1

        return result
      }

      const values = map.value[item.code] || {}
      const filled = all.filter((field) => values[field.path]).length

      result[item.code] = all.length ? filled / all.length : 1

      return result
    }, {})
  })

  function original(path: string): string {
    return read(source.value, path) ?? ''
  }

  function attach(target: Record<string, any> | null) {
    source.value = target
    locale.value = defaultLocale.value
  }

  async function load(id: string | number | null) {
    map.value = {}

    if (id === null || id === undefined) return

    map.value = await $api.get(`/content-translations/${entity}/${id}`).then((res: any) => res.data)
  }

  async function save(id: string | number) {
    if (!spec.length) return

    const payload = visible.value.reduce<TranslationsMap>((result, field) => {
      for (const item of locales.value) {
        if (item.code === defaultLocale.value) continue

        result[item.code] = result[item.code] || {}
        result[item.code][field.path] = map.value[item.code]?.[field.path] || ''
      }

      return result
    }, {})

    await $api.patch(`/content-translations/${entity}/${id}`, { translations: payload })
  }

  function copyFromDefault() {
    const values = visible.value.reduce<Record<string, string>>((result, field) => {
      result[field.path] = original(field.path)

      return result
    }, {})

    map.value = { ...map.value, [locale.value]: values }
  }

  return reactive({ locale, locales, isDefault, fields, visible, status, original, attach, load, save, copyFromDefault })
}
