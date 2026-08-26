import { defineClientModule, LOCALE_HEADER } from 'unicore-api/client'

interface NavForm {
  slug: string
  title: string
  icon: string | null
  nav_order: number
  in_nav: boolean
}

const NAV_TTL = 60000

const cache = new Map<string, { at: number; items: NavForm[] }>()

async function load(base: string, locale: string): Promise<NavForm[]> {
  const key = locale || 'default'
  const hit = cache.get(key)

  if (hit && Date.now() - hit.at < NAV_TTL) return hit.items

  const items = await $fetch<NavForm[]>(`${base}/mod/forms/nav`, {
    headers: locale ? { [LOCALE_HEADER]: locale } : {},
  }).catch(() => [] as NavForm[])

  cache.set(key, { at: Date.now(), items })

  return items
}

export default defineNuxtPlugin(async () => {
  const forms = useState<NavForm[]>('mod-forms-nav', () => [])

  if (!forms.value.length) {
    const base = String(useRuntimeConfig().public.apiBaseurl || '')

    forms.value = await load(base, String(useLocaleCookie().value || ''))
  }

  defineClientModule({
    id: 'forms',
    nav: () => {
      if (!forms.value.length) return []

      return [
        {
          key: 'forms.my',
          to: '/mod/forms/my',
          label: 'mod.forms.my_title',
          icon: 'bx bx-file',
          places: ['cabinet.tabs'],
          when: 'auth',
          order: 96,
        },
        ...forms.value
          .filter((form) => form.in_nav)
          .map((form) => ({
            key: `forms.${form.slug}`,
            to: `/mod/forms/${form.slug}`,
            label: form.title,
            icon: form.icon || 'bx bx-edit-alt',
            places: ['navbar' as const],
            order: form.nav_order,
          })),
      ]
    },
  })
})
