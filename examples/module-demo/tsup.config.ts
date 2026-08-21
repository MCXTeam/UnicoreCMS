import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['server-src/index.ts'],
  outDir: 'server',
  format: ['cjs'],
  dts: false,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: 'es2021',
  external: [
    'unicore-api',
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/typeorm',
    '@nestjs/schedule',
    '@nestjs/platform-express',
    'typeorm',
    'reflect-metadata',
  ],
})
