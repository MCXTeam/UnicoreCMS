import type { SitemapUrl } from '#sitemap/types'

interface ServerEntry {
  id: number | string
  updated?: string
}

interface PageEntry {
  path: string
  updated?: string
  is_rules?: boolean
}

export default defineSitemapEventHandler(async () => {
  const api = useRuntimeConfig().public.apiBaseurl as string
  const urls: SitemapUrl[] = []

  const safeGet = async <T>(path: string): Promise<T | null> => {
    try {
      return (await $fetch(api + path)) as T
    } catch {
      return null
    }
  }

  const servers = await safeGet<ServerEntry[]>('/servers')
  if (servers) {
    for (const server of servers) {
      urls.push({ loc: `/servers/${server.id}`, lastmod: server.updated, changefreq: 'daily' })
      urls.push({ loc: `/donate/${server.id}`, lastmod: server.updated, changefreq: 'daily' })
    }
  }

  const pages = await safeGet<PageEntry[]>('/pages')
  if (pages) {
    for (const page of pages) {
      urls.push({ loc: `/page/${page.path}`, lastmod: page.updated, changefreq: 'daily', priority: page.is_rules ? 1 : undefined })
    }
  }

  const news = await safeGet<Array<string | number>>('/news/helper/sitemap')
  if (news) {
    for (const id of news) urls.push({ loc: `/news/${id}`, changefreq: 'daily' })
  }

  const usernames = await safeGet<string[]>('/users/public/users')
  if (usernames) {
    for (const username of usernames) urls.push({ loc: `/user/${username}`, changefreq: 'daily' })
  }

  return urls
})
