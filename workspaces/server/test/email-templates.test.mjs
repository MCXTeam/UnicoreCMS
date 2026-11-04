import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { compileSource } from './helpers/compile-source.mjs';

const directory = await mkdtemp(join(tmpdir(), 'unicore-email-'));
after(() => rm(directory, { recursive: true, force: true }));
const { renderEmailTemplate, renderEmailMessage } = await compileSource('admin/email/email.utils.ts', directory, 'renderer');
const { EMAIL_TEMPLATES_V1 } = await compileSource('admin/email/templates/v1.ts', directory, 'templates');
const { LEGACY_EMAIL_TEMPLATES } = await compileSource('admin/email/templates/legacy.ts', directory, 'legacy');
const { EmailTemplateDesign1793750400000 } = await compileSource('migrations/steps/1793750400000-email-template-design.migration.ts', directory, 'migration');
const values = { SITENAME: 'Craft & Friends', USERNAME: 'Alex', CODE: 'A7K9M2', IP: '192.0.2.1', LINK: 'https://example.com/auth/password?hash=abc&next=account', SENDER: 'Steve', GIFT: 'VIP', EMAIL: 'alex@example.com' };

test('renders all six defaults with a branded subject and escaped HTML', () => {
  assert.equal(EMAIL_TEMPLATES_V1.length, 6);
  assert.equal(new Set(EMAIL_TEMPLATES_V1.map((template) => template.id)).size, 6);
  for (const template of EMAIL_TEMPLATES_V1) {
    const message = renderEmailMessage(template, values);
    assert.ok(message.subject.startsWith('Craft & Friends — '));
    assert.match(message.html, /Craft &amp; Friends/);
    assert.match(message.html, /<!doctype html>/);
    assert.doesNotMatch(message.html, /\{[A-Z_]+\}/);
  }
  const reset = renderEmailMessage(EMAIL_TEMPLATES_V1.find((item) => item.id === 'reset'), values);
  assert.ok(reset.html.includes('href="https://example.com/auth/password?hash=abc&amp;next=account"'));
});

test('does not interpret user values as placeholders or HTML', () => {
  assert.equal(renderEmailTemplate('{USERNAME} {CODE} {UNKNOWN}', { USERNAME: '<img src=x> {CODE}', CODE: 'SECRET' }), '&lt;img src=x&gt; {CODE} SECRET {UNKNOWN}');
  const message = renderEmailMessage({ title: '{SITENAME}\r\nHello', content: '<a href="{LINK}">{USERNAME}</a>' }, { SITENAME: 'A & B\nBcc: x', LINK: 'https://example.com/" onclick="evil', USERNAME: "<>&\"'" });
  assert.equal(message.subject, 'A & B Bcc: x Hello');
  assert.doesNotMatch(message.html, /href="[^\"]*" onclick=/);
  assert.match(message.html, /&lt;&gt;&amp;&quot;&#39;/);
});

test('updates only exact legacy defaults and is idempotent', async () => {
  for (const customization of [null, 'title', 'content', 'case', 'whitespace']) {
    const rows = structuredClone(LEGACY_EMAIL_TEMPLATES);
    if (customization === 'title') rows[0].title = 'Мой заголовок';
    if (customization === 'content') rows[0].content = '<p>Мой шаблон</p>';
    if (customization === 'case') rows[0].title = rows[0].title.toLowerCase();
    if (customization === 'whitespace') rows[0].content += ' ';
    const original = structuredClone(rows[0]);
    let updates = 0;
    const runner = {
      hasTable: async (name) => { assert.equal(name, 'unicore_email_messages'); return true; },
      query: async (sql, [title, content, id, oldTitle, oldContent]) => {
        assert.match(sql, /BINARY `title` = BINARY \? AND BINARY `content` = BINARY \?/);
        const row = rows.find((item) => item.id === id);
        if (row.title === oldTitle && row.content === oldContent) { Object.assign(row, { title, content }); updates++; }
      },
    };
    const migration = new EmailTemplateDesign1793750400000();
    await migration.up(runner);
    assert.equal(updates, customization ? 5 : 6);
    assert.deepEqual(rows[0], customization ? original : EMAIL_TEMPLATES_V1[0]);
    await migration.up(runner);
    assert.equal(updates, customization ? 5 : 6);
  }
});

test('supports a new installation before the email table exists', async () => {
  await new EmailTemplateDesign1793750400000().up({ hasTable: async () => false, query: () => assert.fail('must not query a missing table') });
});
