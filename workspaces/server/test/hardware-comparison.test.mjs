import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { compileSource } from './helpers/compile-source.mjs';

describe('Gravit hardware comparison and binary normalization', () => {
  let directory, module;
  const info = { bitness: 64, totalMemory: 32 * 1073741824, logicalProcessors: 16, physicalProcessors: 8, processorMaxFreq: 4_500_000_000, battery: false, hwDiskId: 'disk-12345678', baseboardSerialNumber: 'board-12345678', displayId: 'AQIDBA==' };
  before(async () => { directory = await mkdtemp(join(tmpdir(), 'unicore-hardware-')); module = await compileSource('auth/hardware/hardware-comparison.ts', directory); });
  after(async () => { if (directory && resolve(directory).startsWith(resolve(tmpdir()) + sep)) await rm(directory, { recursive: true, force: true }); });
  it('uses the Gravit score for identical reports and a small serial change', () => {
    assert.ok(Math.abs(module.gravitComparison(info, info) - 2.34) < 1e-9);
    assert.ok(Math.abs(module.gravitComparison(info, { ...info, hwDiskId: 'disk-1234567Z' }) - 2.20) < 1e-9);
  });
  it('does not recognize a different device merely from the same performance statistics', () => {
    const other = { ...info, hwDiskId: 'completely-different-storage', baseboardSerialNumber: 'unrelated-motherboard', displayId: 'BQYHCA==' };
    assert.ok(module.gravitComparison(info, other) <= 1.0);
  });
  it('normalizes signed Java byte arrays and base64 to the same key', () => {
    assert.equal(module.binaryValue([-1, 0, 127, -128]), '/wB/gA==');
    assert.equal(module.binaryValue('/wB/gA=='), '/wB/gA==');
    assert.equal(module.hardwareHash(module.binaryValue([1,2,3,4])), module.hardwareHash('AQIDBA=='));
    assert.throws(() => module.binaryValue([256]));
    assert.throws(() => module.binaryValue('invalid!'));
  });
});
