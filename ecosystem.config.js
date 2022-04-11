const { envConfig } = require('unicore-common/dist/envconfig')

module.exports = {
  apps: [
    {
      name: 'unicore-client',
      script: './node_modules/nuxt/bin/nuxt.js',
      cwd: "./workspaces/client",
      args: 'start',
      env: {
        NAME: envConfig.name
      }
    },
    {
      name: 'unicore-admin',
      script: './node_modules/nuxt/bin/nuxt.js',
      cwd: "./workspaces/admin",
      args: 'start',
      env: {
        NAME: envConfig.name
      }
    },
    {
      name: 'unicore-server',
      script: './dist/main.js',
      cwd: "./workspaces/server",
      args: 'start',
      env: {
        NAME: envConfig.name
      }
    }
  ]
}
