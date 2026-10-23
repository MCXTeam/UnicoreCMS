const { resolve, join, dirname, basename } = require('node:path');
const { homedir } = require('node:os');
const { accessSync, constants } = require('node:fs');
const { createHash } = require('node:crypto');

module.exports = function installationPaths(root, data = root, directory) {
  root = resolve(root);
  data = resolve(data);
  directory ||= process.env.UNICORE_UPDATER_DIRECTORY;
  if (!directory) {
    try {
      accessSync(dirname(data), constants.W_OK);
      directory = join(dirname(data), `.${basename(data)}-updater`);
    } catch {
      const id = createHash('sha256').update(data).digest('hex').slice(0, 16);
      directory = join(homedir(), '.local', 'state', 'unicore-updater', id);
    }
  }
  directory = resolve(directory);
  return { root, data, directory, launcher: join(directory, 'launcher.json') };
};
