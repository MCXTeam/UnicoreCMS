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
      script: 'start.mjs',
      interpreter: 'node',
    },
    {
      name: 'unicore-admin',
      cwd: './workspaces/admin',
      script: 'start.mjs',
      interpreter: 'node',
    },
  ],
};
