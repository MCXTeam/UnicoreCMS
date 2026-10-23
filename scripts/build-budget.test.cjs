const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Module } = require('node:module');
const ts = require('typescript');

test('build heap respects its own budget without exceeding the container limit', () => {
  const filename = path.resolve(__dirname, '../workspaces/common/src/build.ts');
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const loaded = new Module(filename);
  loaded.require = (id) => {
    if (id === 'fs') return { ...fs, readFileSync: () => String(8 * 1024 ** 3) };
    if (id === './ports') return { envFilePath: '/site/.env' };
    if (id === './constants') return { CGROUP_LIMIT_FILES: ['/fixture/memory.max'], CGROUP_LIMIT_MAX: Number.MAX_SAFE_INTEGER, BUILD_HEAP_SHARE: 0.75, BUILD_HEAP_MIN_MB: 128 };
    return require(id);
  };
  loaded._compile(output.outputText, filename);
  const before = process.env.UNICORE_BUILD_MEMORY_BYTES;
  try {
    process.env.UNICORE_BUILD_MEMORY_BYTES = String(4 * 1024 ** 3);
    assert.deepEqual(loaded.exports.heapOptions(), ['--max-old-space-size=3072']);
    process.env.UNICORE_BUILD_MEMORY_BYTES = String(16 * 1024 ** 3);
    assert.deepEqual(loaded.exports.heapOptions(), ['--max-old-space-size=6144']);
    process.env.UNICORE_BUILD_MEMORY_BYTES = '-1';
    assert.deepEqual(loaded.exports.heapOptions(), ['--max-old-space-size=6144']);
  } finally {
    if (before === undefined) delete process.env.UNICORE_BUILD_MEMORY_BYTES;
    else process.env.UNICORE_BUILD_MEMORY_BYTES = before;
  }
});
