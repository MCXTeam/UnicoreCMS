const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { heapOptions } = require('./heap');

const DIST = path.resolve(__dirname, 'dist');
const WEBPACK_CLI = require.resolve('webpack-cli/bin/cli.js');

fs.rmSync(DIST, { recursive: true, force: true });

execFileSync(process.execPath, [...heapOptions(), WEBPACK_CLI], { stdio: 'inherit', cwd: __dirname });

require('./postbuild');
