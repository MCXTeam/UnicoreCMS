module.exports = {
  apps: [
    {
      cwd: 'unicore-server',
      name: 'UnicoreServer',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}
