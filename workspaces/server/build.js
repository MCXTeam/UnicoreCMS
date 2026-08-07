const fs = require('fs');
const path = require('path');
const { runNode } = require('unicore-common/build');
const { obfuscate } = require('./postbuild');

const DIST = path.resolve(__dirname, 'dist');
const WEBPACK_CLI = require.resolve('webpack-cli/bin/cli.js');

async function build() {
  fs.rmSync(DIST, { recursive: true, force: true });

  await runNode([WEBPACK_CLI], __dirname);
  await obfuscate();
}

build();
