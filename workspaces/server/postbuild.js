const fs = require('fs');
const path = require('path');
const { runNode } = require('unicore-common/build');

const BUNDLES = ['dist/main.js', 'dist/cli/main.js'];
const EXECUTABLE = 'dist/cli/main.js';

if (process.env.OBFUSCATE !== '0') {
  const obfuscator = path.resolve(__dirname, 'obfuscate.js');

  for (const bundle of BUNDLES) runNode([obfuscator, path.resolve(__dirname, bundle)], __dirname);
}

fs.chmodSync(path.resolve(__dirname, EXECUTABLE), 0o755);
