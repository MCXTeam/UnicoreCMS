const fs = require('fs')
const path = require('path')

fs.chmodSync(path.resolve(__dirname, "dist/cli/main.js"), 777)