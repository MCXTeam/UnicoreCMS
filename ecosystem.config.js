const updaterLauncher = process.env.UNICORE_UPDATER_LAUNCHER;
const updaterConfig = process.env.UNICORE_UPDATER_LAUNCHER_CONFIG;

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
  ].map(app => updaterLauncher && updaterConfig ? {
    ...app,
    script: updaterLauncher,
    args: [updaterConfig, app.name.replace('unicore-', '')],
    interpreter: 'node',
  } : app),
};
