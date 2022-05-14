const path = require('path');
const webpack = require("webpack");
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

const main = module.exports = {
  entry: {
    main: './src/main.ts',
    ormconfig: './src/ormconfig.ts',
    "ormconfig-schema": './src/ormconfig-schema.ts'
  },
  target: 'node',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [
    new WebpackObfuscator({
      optionsPreset: "high-obfuscation",
      target: "node"
    })
  ],
  externals: [
    nodeExternals(),
    nodeExternals({
      modulesDir: path.resolve(__dirname, '../../node_modules'),
    })
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.build.json' })],
  },
  module: {
    rules: [{ test: /\.ts$/, loader: 'ts-loader' }],
  }
};

const cli = {
  ...main,
  entry: "./src/cli/main.ts",
  output: {
    path: path.resolve(__dirname, 'dist/cli'),
    filename: 'main.js',
  },
  plugins: [
    new WebpackObfuscator({
      optionsPreset: "high-obfuscation",
      target: "node"
    }),
    new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
  ]
}


module.exports = [main, cli]