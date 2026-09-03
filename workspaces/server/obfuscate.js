const fs = require('fs');
const { obfuscate } = require('javascript-obfuscator');

const OBFUSCATOR_OPTIONS = {
  optionsPreset: 'medium-obfuscation',
  target: 'node',
};

const bundle = process.argv[2];

fs.writeFileSync(bundle, obfuscate(fs.readFileSync(bundle, 'utf8'), OBFUSCATOR_OPTIONS).getObfuscatedCode());
