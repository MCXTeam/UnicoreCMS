const fs = require('fs');
const path = require('path');
const { runNode } = require('unicore-common/build');

const BUNDLES = ['dist/main.js', 'dist/cli/main.js'];
const EXECUTABLE = 'dist/cli/main.js';

function chunks(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return chunks(filename);
    return entry.name.endsWith('.js') && filename.includes(`${path.sep}chunks${path.sep}`) ? [filename] : [];
  });
}

async function obfuscate() {
  if (process.env.OBFUSCATE !== '0') {
    const obfuscator = path.resolve(__dirname, 'obfuscate.js');

    const bundles = [...BUNDLES.map((bundle) => path.resolve(__dirname, bundle)), ...chunks(path.resolve(__dirname, 'dist'))];
    for (const bundle of bundles) await runNode([obfuscator, bundle], __dirname);
  }

  fs.chmodSync(path.resolve(__dirname, EXECUTABLE), 0o755);
}

module.exports = { obfuscate };

if (require.main === module) obfuscate();
