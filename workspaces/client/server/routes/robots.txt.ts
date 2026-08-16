import { PRIVATE_ROUTES } from '~/constants'

export default defineEventHandler((event) => {
  const baseurl = String(useRuntimeConfig().public.baseurl || '').replace(/\/$/, '')

  const lines = ['User-agent: *', ...PRIVATE_ROUTES.map((route) => `Disallow: ${route}`)]

  if (baseurl) lines.push('', `Sitemap: ${baseurl}/sitemap.xml`)

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  return lines.join('\n') + '\n'
})
