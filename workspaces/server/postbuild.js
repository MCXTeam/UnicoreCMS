const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { heapOptions } = require('./heap');

const BUNDLES = ['dist/main.js', 'dist/cli/main.js'];
const EXECUTABLE = 'dist/cli/main.js';

if (process.env.OBFUSCATE !== '0') {
  const options = heapOptions();
  const obfuscator = path.resolve(__dirname, 'obfuscate.js');

  for (const bundle of BUNDLES) {
    execFileSync(process.execPath, [...options, obfuscator, path.resolve(__dirname, bundle)], { stdio: 'inherit' });
  }
}

fs.chmodSync(path.resolve(__dirname, EXECUTABLE), 0o755);
