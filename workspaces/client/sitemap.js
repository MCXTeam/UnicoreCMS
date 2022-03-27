import axios from 'axios'
import {
  envConfig
} from 'unicore-common/dist/envconfig'

export const sitemapSettings = {
  path: '/sitemap.xml',
  sitemaps: [{
      path: 'sitemap-index.xml',
      exclude: ['/auth/**', '/cabinet/**', '/store/**', '/players/**', '/auth', '/cabinet', '/store', '/players'],
      defaults: {
        changefreq: 'daily',
        priority: 1,
        lastmod: new Date(),
      },
    },
    {
      path: '/sitemap-servers-and-donates.xml',
      exclude: ['/**'],
      routes: async () => {
        try {
          const servers = await axios.get(envConfig.apiBaseurl + '/servers').then((res) => res.data)

          return [
            servers.map((server) => ({
              url: '/servers/' + server.id,
              lastmod: server.updated,
              changefreq: 'daily',
            })),
            servers.map((server) => ({
              url: '/donate/' + server.id,
              lastmod: server.updated,
              changefreq: 'daily',
            })),
          ].flat()
        } catch {
          return []
        }
      },
    },
    {
      path: '/sitemap-pages.xml',
      exclude: ['/**'],
      routes: async () => {
        try {
          const pages = await axios.get(envConfig.apiBaseurl + '/pages').then((res) => res.data)

          return pages.map((page) => ({
            url: '/page/' + page.path,
            priority: page.is_rules && 1,
            lastmod: page.updated,
            changefreq: 'daily',
          }))
        } catch {
          return []
        }
      },
    },
    {
      path: '/sitemap-users.xml',
      exclude: ['/**'],
      routes: async () => {
        try {
          const usernames = await axios.get(envConfig.apiBaseurl + '/users/public/users').then((res) => res.data)

          return usernames.map((username) => ({
            url: '/user/' + username,
            lastmod: new Date(),
            changefreq: 'daily',
          }))
        } catch {
          return []
        }
      },
    },
  ],
}
