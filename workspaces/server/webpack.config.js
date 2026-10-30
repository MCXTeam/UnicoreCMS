const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { buildParallelism } = require('unicore-common/build');

const base = {
  target: 'node',
  mode: 'production',
  parallelism: buildParallelism(),
  externals: [
    nodeExternals(),
    nodeExternals({
      modulesDir: path.resolve(__dirname, '../../node_modules'),
    }),
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
  optimization: {
    minimize: false,
  },
  resolve: {
    extensionAlias: { '.js': ['.js', '.ts'] },
    extensions: ['.ts', '.js'],
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.build.json' })],
  },
  module: {
    rules: [{ test: /\.ts$/, loader: 'ts-loader' }],
  },
};

const orm = {
  ...base,
  entry: './src/ormconfig-schema.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
    filename: 'ormconfig-schema.js',
    chunkFilename: 'chunks/[name].[contenthash].js',
  },
};

const schema = {
  ...base,
  entry: './src/migrations/bootstrap.ts',
  output: {
    path: path.resolve(__dirname, 'dist/migrations'),
    filename: 'cli.js',
    chunkFilename: 'chunks/[name].[contenthash].js',
  },
};

const main = {
  ...base,
  entry: './src/bootstrap.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: 'chunks/[name].[contenthash].js',
  },
};

const cli = {
  ...base,
  entry: './src/cli/bootstrap.ts',
  output: {
    path: path.resolve(__dirname, 'dist/cli'),
    filename: 'main.js',
    chunkFilename: 'chunks/[name].[contenthash].js',
  },
  plugins: [new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true })],
};

module.exports = [orm, schema, main, cli];
