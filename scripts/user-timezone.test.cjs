const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');
const clientRequire = createRequire(resolve(__dirname, '../workspaces/client/package.json'));
const moment = clientRequire('moment-timezone');
const file = resolve(__dirname, '../workspaces/ui/utils/userDate.ts');
const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const helper = { exports: {} };
runInNewContext(source, { exports: helper.exports, Intl });
const { userDateFactory, validUserTimezone } = helper.exports;

test('one UTC instant displays in each viewer timezone without changing its value', () => {
  const instant = '2026-10-22T11:00:00.000Z';
  for (const [zone, expected] of [['Europe/Moscow', '14:00'], ['Asia/Yekaterinburg', '16:00'], ['America/New_York', '07:00']]) {
    const local = userDateFactory(moment, () => zone)(instant);
    assert.equal(local.format('HH:mm'), expected);
    assert.equal(local.valueOf(), Date.parse(instant));
  }
});

test('timezone changes are read on the next call and respect daylight saving and date boundaries', () => {
  let zone = 'America/New_York';
  const local = userDateFactory(moment, () => zone);
  assert.equal(local('2026-01-22T11:00:00Z').format('HH:mm'), '06:00');
  assert.equal(local('2026-07-22T11:00:00Z').format('HH:mm'), '07:00');
  zone = 'Asia/Tokyo';
  assert.equal(local('2026-10-22T23:30:00Z').format('YYYY-MM-DD HH:mm'), '2026-10-23 08:30');
});

test('local form values, Unix milliseconds and moment static methods keep their semantics', () => {
  const local = userDateFactory(moment, () => 'Europe/Moscow');
  assert.equal(local('2026-10-22 14:00', 'YYYY-MM-DD HH:mm', true).toISOString(), '2026-10-22T11:00:00.000Z');
  assert.equal(local(Date.parse('2026-10-22T11:00:00Z')).format('HH:mm'), '14:00');
  assert.equal(local.duration(90, 'minutes').asMinutes(), 90);
  assert.equal(local.utc('2026-10-22T11:00:00Z').format('HH:mm'), '11:00');
  assert.equal(local.isMoment(local()), true);
});

test('invalid cookies and unavailable browser timezone fall back to UTC', () => {
  for (const value of ['', null, {}, 'Invalid/Timezone']) assert.equal(validUserTimezone(value), false);
  assert.equal(validUserTimezone('Europe/Moscow'), true);
  const fallback = { exports: {} };
  runInNewContext(source, { exports: fallback.exports, Intl: { DateTimeFormat() { throw Error('unavailable'); } } });
  assert.equal(fallback.exports.browserTimezone(), 'UTC');
});
