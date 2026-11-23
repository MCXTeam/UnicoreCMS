import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { settingIssue } from 'unicore-api';
import { settingsFixture } from './helpers/settings-fixture.mjs';

const directory = await mkdtemp(join(tmpdir(), 'settings-test-'));
after(() => rm(directory, { recursive: true, force: true }));
const { ModulesController, ConfigService, ConfigController, coreConfigDefaults, coreSettingsSchema, ConfigField } = await settingsFixture(
  directory,
);

function setup() {
  let rows = coreConfigDefaults().map((item) => ({ ...item, value: item.value ?? null }));
  let invalidations = 0;
  const repo = {
    find: async () => structuredClone(rows),
    findOneBy: async (where) => structuredClone(rows.find((row) => row.key === where.key)),
    save: async (row) => {
      rows[rows.findIndex((item) => item.key === row.key)] = row;
      return row;
    },
    manager: {
      transaction: async (work) => {
        const pending = structuredClone(rows);
        await work({
          getRepository: () => ({
            findOne: async ({ where }) => pending.find((row) => row.key === where.key),
            save: async () => undefined,
            createQueryBuilder: () => {
              let inserted;
              const query = {
                insert: () => query,
                into: () => query,
                values: (row) => {
                  inserted = row;
                  return query;
                },
                orIgnore: () => query,
                execute: async () => {
                  if (!pending.some((row) => row.key === inserted.key)) pending.push({ ...inserted });
                },
              };
              return query;
            },
          }),
        });
        rows = pending;
      },
    },
  };
  const service = new ConfigService(
    {
      get: async () => null,
      set: async () => undefined,
      del: async () => {
        invalidations++;
      },
    },
    repo,
  );
  return { service, rows: () => rows, invalidations: () => invalidations };
}

test('every core setting has a unique schema and retains its seeded default', () => {
  const fields = coreSettingsSchema();
  assert.equal(new Set(fields.map((item) => item.key)).size, Object.keys(ConfigField).length);
  assert.equal(fields.length, coreConfigDefaults().length);
  for (const field of fields) assert.equal(settingIssue(field, String(field.default)), null, field.key);
});

test('schema validation covers values, constraints and safe image URLs', () => {
  for (const value of ['', 'NaN', 'Infinity', '11', '-1']) assert.ok(settingIssue({ key: 'n', type: 'number', min: 0, max: 10 }, value));
  assert.equal(settingIssue({ key: 'n', type: 'number', integer: true }, '1.5'), 'settings.error.integer');
  assert.equal(settingIssue({ key: 'b', type: 'boolean' }, 'sometimes'), 'settings.error.boolean');
  assert.equal(settingIssue({ key: 'b', type: 'boolean' }, '0'), null);
  assert.equal(settingIssue({ key: 's', type: 'select', options: [{ value: 'a', label: 'A' }] }, 'b'), 'settings.error.option');
  for (const value of ['javascript:alert(1)', '//other.example/image.png', 'https://user:password@example.com/a', '/\\host/a'])
    assert.equal(settingIssue({ key: 'logo', type: 'string', input: 'image' }, value), 'settings.error.url');
  assert.equal(settingIssue({ key: 'logo', type: 'string', input: 'image' }, '/uploads/logo.png'), null);
});

test('a valid batch is saved together and invalidates the cache once', async () => {
  const state = setup();
  await state.service.saveSettings([
    { key: ConfigField.ProjectName, value: 'Craft', expected: '' },
    { key: ConfigField.EconomyRate, value: '200', expected: '100' },
  ]);
  assert.equal(state.rows().find((item) => item.key === ConfigField.ProjectName).value, 'Craft');
  assert.equal(state.rows().find((item) => item.key === ConfigField.EconomyRate).value, '200');
  assert.equal(state.invalidations(), 1);
});

test('validation and stale values leave the entire batch unchanged', async () => {
  for (const failure of [
    { key: ConfigField.EconomyRate, value: '-1', expected: '100' },
    { key: ConfigField.ProjectName, value: 'Craft', expected: 'changed elsewhere' },
    { key: 'unknown', value: 'x', expected: null },
  ]) {
    const state = setup();
    const before = structuredClone(state.rows());
    await assert.rejects(
      state.service.saveSettings([{ key: ConfigField.EmailActivationRequired, value: 'false', expected: 'true' }, failure]),
    );
    assert.deepEqual(state.rows(), before);
    assert.equal(state.invalidations(), 0);
  }
});

test('legacy writes share validation and cannot change a known field type', async () => {
  const { service } = setup();
  await assert.rejects(service.update({ key: ConfigField.EconomyRate, type: 1, value: 'oops' }));
  await assert.rejects(service.update({ key: ConfigField.EmailActivationRequired, type: 2, value: 'oops' }));
  await service.update({ key: ConfigField.EconomyRate, type: 0, value: 125 });
  assert.equal((await service.findPublic())[ConfigField.EconomyRate], 125);
});

test('module settings cannot write a core or another module field', async () => {
  const { service } = setup();
  await assert.rejects(service.saveSettings([{ key: ConfigField.ProjectName, value: 'wrong', expected: '' }], 'sample'));
  assert.ok((await service.settings('sample')).fields.every((field) => field.moduleId === 'sample'));
  assert.ok((await service.settings()).fields.every((field) => field.moduleId !== 'disabled'));
});

test('a module setting registered after startup can be created and still rejects a stale snapshot', async () => {
  const state = setup();
  await state.service.saveSettings([{ key: 'mod_sample_limit', value: '4', expected: null }], 'sample');
  assert.equal(state.rows().find((row) => row.key === 'mod_sample_limit').value, '4');
  await assert.rejects(
    state.service.saveSettings([{ key: 'mod_sample_limit', value: '5', expected: null }], 'sample'),
    (error) => error.status === 409,
  );
  assert.equal(state.rows().find((row) => row.key === 'mod_sample_limit').value, '4');
});

test('RCON-only access filters the catalog and rejects a mixed batch before saving', async () => {
  const state = setup();
  const controller = new ConfigController(state.service);
  const request = { permissions: ['panel.servers.issuance'] };
  const catalog = await controller.settings(request);
  assert.ok(catalog.fields.length > 0);
  assert.ok(catalog.fields.every((field) => field.key.startsWith('rcon_')));
  await assert.rejects(
    controller.saveSettings(request, {
      changes: [
        { key: 'rcon_preset', value: 'vanilla', expected: 'luckperms' },
        { key: ConfigField.ProjectName, value: 'x', expected: '' },
      ],
    }),
    (error) => error.status === 403,
  );
  assert.equal(state.invalidations(), 0);
  await assert.rejects(controller.settings({ permissions: [] }), (error) => error.status === 403);
});

test('write-only permissions do not reveal unrelated settings in the save response', async () => {
  const state = setup();
  const controller = new ConfigController(state.service);
  const request = { permissions: ['panel.config.update'] };
  await assert.rejects(controller.settings(request), (error) => error.status === 403);
  const catalog = await controller.saveSettings(request, { changes: [{ key: ConfigField.ProjectName, value: 'Craft', expected: '' }] });
  assert.deepEqual(
    catalog.fields.map((field) => field.key),
    [ConfigField.ProjectName],
  );
});

test('module write-only access does not reveal unchanged private settings', async () => {
  const { service } = setup();
  const controller = new ModulesController({}, {}, service);
  const catalog = await controller.saveSettings(
    'sample',
    {
      changes: [{ key: 'mod_sample_limit', value: '4', expected: null }],
    },
    { permissions: ['panel.extensions.manage'] },
  );
  assert.deepEqual(
    catalog.fields.map((field) => field.key),
    ['mod_sample_limit'],
  );
});
