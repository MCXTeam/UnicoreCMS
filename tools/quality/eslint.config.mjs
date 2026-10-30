import js from '@eslint/js'
import typescript from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import { resolve } from 'node:path'

const unused = { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }
const tsRules = Object.assign({}, ...typescript.configs.recommended.map((config) => config.rules || {}))
const vueRules = Object.assign({}, ...vue.configs['flat/essential'].map((config) => config.rules || {}))

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.output/**', '**/.nuxt/**', '**/.codex/**', 'docs/**', 'modules/**', 'themes/**'] },
  {
    files: ['**/*.{js,cjs,mjs,ts,cts,mts,vue}'],
    languageOptions: { ecmaVersion: 'latest', globals: globals.node },
    rules: { ...js.configs.recommended.rules, 'no-unused-vars': ['error', unused], 'no-empty': ['error', { allowEmptyCatch: true }] },
  },
  { files: ['**/*.cjs'], languageOptions: { sourceType: 'commonjs' } },
  {
    files: ['**/*.{ts,cts,mts,vue}'],
    languageOptions: { parser: typescript.parser },
    plugins: { '@typescript-eslint': typescript.plugin },
    rules: { ...tsRules, '@typescript-eslint/no-explicit-any': 'warn', '@typescript-eslint/no-unused-vars': ['error', unused] },
  },
  {
    files: ['**/*.vue'],
    processor: vue.processors.vue,
    languageOptions: { parser: vueParser, globals: globals.browser, parserOptions: { parser: typescript.parser, sourceType: 'module' } },
    plugins: { vue },
    rules: vueRules,
  },
  { files: ['workspaces/{admin,client}/pages/**/*.vue'], rules: { 'vue/multi-word-component-names': 'off' } },
  { files: ['workspaces/updater/src/files.mjs', 'workspaces/api/licensing-src/sdk.cjs'], rules: { 'no-control-regex': 'off' } },
  {
    files: [
      'workspaces/server/src/modules/licensing/**/*.ts',
      'workspaces/server/src/modules/license-middleware.ts',
      'workspaces/api/src/server/licensing.ts',
      'workspaces/api/src/nuxt/browser-layer.ts',
      'workspaces/admin/pages/licenses.vue',
    ],
    languageOptions: {
      parserOptions: { projectService: true, extraFileExtensions: ['.vue'], tsconfigRootDir: resolve(import.meta.dirname, '../..') },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
]
