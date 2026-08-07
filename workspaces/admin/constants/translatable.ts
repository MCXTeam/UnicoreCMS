export interface TranslatableField {
  path: string
  label: string
  type: 'text' | 'textarea' | 'html'
  row?: number
}

export const TRANSLATABLE_FIELDS: Record<string, TranslatableField[]> = {
  news: [
    { path: 'title', label: 'admin.name', type: 'text' },
    { path: 'short_description', label: 'admin.short_description', type: 'textarea' },
    { path: 'description', label: 'admin.content', type: 'html' },
  ],
  page: [
    { path: 'title', label: 'admin.heading', type: 'text' },
    { path: 'description', label: 'admin.meta_description', type: 'textarea' },
    { path: 'content', label: 'admin.content', type: 'html' },
  ],
  email_message: [
    { path: 'title', label: 'admin.heading', type: 'text' },
    { path: 'content', label: 'admin.content', type: 'html' },
  ],
  server: [
    { path: 'name', label: 'admin.name', type: 'text' },
    { path: 'slogan', label: 'admin.slogan', type: 'text' },
    { path: 'description', label: 'admin.meta_description', type: 'textarea' },
    { path: 'content', label: 'admin.description', type: 'html' },
    { path: 'table.*.title', label: 'admin.heading', type: 'text' },
    { path: 'table.*.description', label: 'admin.description', type: 'text' },
  ],
  mod: [
    { path: 'name', label: 'admin.name', type: 'text' },
    { path: 'description', label: 'admin.description', type: 'html' },
  ],
  product: [
    { path: 'name', label: 'admin.name', type: 'text' },
    { path: 'description', label: 'admin.description', type: 'html' },
  ],
  kit: [
    { path: 'name', label: 'admin.name', type: 'text' },
    { path: 'description', label: 'admin.description', type: 'html' },
  ],
  category: [
    { path: 'name', label: 'admin.name', type: 'text' },
    { path: 'description', label: 'admin.description', type: 'textarea' },
  ],
  donate_group: [
    { path: 'name', label: 'admin.name', type: 'text' },
    { path: 'description', label: 'admin.description', type: 'html' },
    { path: 'features.*.title', label: 'admin.heading', type: 'text' },
    { path: 'features.*.description', label: 'admin.description', type: 'text' },
  ],
  donate_permission: [
    { path: 'name', label: 'admin.name', type: 'text' },
    { path: 'description', label: 'admin.description', type: 'html' },
  ],
  group_kit: [
    { path: 'name', label: 'admin.name', type: 'text' },
    { path: 'description', label: 'admin.description', type: 'html' },
  ],
  period: [{ path: 'name', label: 'admin.name', type: 'text' }],
}
