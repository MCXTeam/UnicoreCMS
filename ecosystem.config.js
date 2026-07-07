module.exports = {
  apps: [
    {
      name: 'unicore-server',
      cwd: './workspaces/server',
      script: 'dist/main.js',
    },
    {
      name: 'unicore-client',
      cwd: './workspaces/client',
      script: '.output/server/index.mjs',
      env: {
        HOST: '0.0.0.0',
        PORT: process.env.CLIENT_PORT || 3000,
      },
    },
    {
      name: 'unicore-admin',
      cwd: './workspaces/admin',
      script: '.output/server/index.mjs',
      env: {
        HOST: '0.0.0.0',
        PORT: process.env.ADMIN_PORT || 4000,
      },
    },
  ],
};
