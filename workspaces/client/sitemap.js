import axios from 'axios'
import { envConfig } from 'unicore-common/dist/envconfig'

export const sitemapSettings = {
  path: '/sitemap.xml',
  sitemaps: [
    {
      path: 'sitemap-index.xml',
      exclude: ["/auth/**", "/cabinet/**", '/auth', '/cabinet'],
      defaults: {
        changefreq: 'daily',
        priority: 1,
        lastmod: new Date()
      }
    },
    {
      path: '/sitemap-servers.xml',
      exclude: ['/**'],
      routes: async () => {
        try {
          const servers = await axios.get(envConfig.apiBaseurl + '/servers').then(res => res.data)

          return servers.map((server) => ({
            url: '/servers/' + server.id,
            lastmod: server.updated,
            changefreq: 'daily',
          }))
        } catch {
          return []
        }
      }
    },
    {
      path: '/sitemap-pages.xml',
      exclude: ['/**'],
      routes: async () => {
        try {
          const pages = await axios.get(envConfig.apiBaseurl + '/pages').then(res => res.data)

          return pages.map((page) => ({
            url: '/page/' + page.id,
            priority: page.is_rules && 1,
            lastmod: page.updated,
            changefreq: 'daily',
          }))
        } catch {
          return []
        }
      }
    },
  ]
}
