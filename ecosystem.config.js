const updaterLauncher = process.env.UNICORE_UPDATER_LAUNCHER;
const updaterConfig = process.env.UNICORE_UPDATER_LAUNCHER_CONFIG;
const path = require('node:path');
const data = process.env.UNICORE_DATA_ROOT || __dirname;
const { directory } = require('./workspaces/updater/src/paths.cjs')(__dirname, data);
const launcher = updaterConfig || path.join(directory, 'launcher.json');

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
    args: [launcher, app.name.replace('unicore-', '')],
    interpreter: 'node',
  } : {
    ...app,
    cwd: __dirname,
    script: path.join(__dirname, 'scripts/launcher.mjs'),
    args: [launcher, app.name.replace('unicore-', '')],
    interpreter: 'node',
  }).concat(updaterLauncher && updaterConfig ? [] : [{
    name: 'unicore-updater',
    cwd: __dirname,
    script: path.join(__dirname, 'scripts/updater-agent.mjs'),
    interpreter: 'node',
    kill_timeout: 30000,
  }]),
};
