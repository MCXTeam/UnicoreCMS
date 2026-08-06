const fs = require('fs');
const path = require('path');
const { runNode } = require('unicore-common/build');

const DIST = path.resolve(__dirname, 'dist');
const WEBPACK_CLI = require.resolve('webpack-cli/bin/cli.js');

fs.rmSync(DIST, { recursive: true, force: true });

runNode([WEBPACK_CLI], __dirname);

require('./postbuild');
