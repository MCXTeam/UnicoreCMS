import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { compileSource } from './helpers/compile-source.mjs';

const directory = await mkdtemp(join(tmpdir(), 'unicore-email-preview-'));
after(() => rm(directory, { recursive: true, force: true }));
const { emailPreview, isSimpleEmailTemplate } = await compileSource('../../admin/utils/email-preview.ts', directory);

test('preserves layout and inline CSS while isolating active content', () => {
  const source = '<!doctype html><html><head><style>p{color:purple}</style><meta http-equiv="refresh" content="0;url=https://example.com"><base href="https://example.com"></head><body style="background:#fff"><script>alert(1)</script><iframe src="https://example.com"></iframe><form action="https://example.com"><input></form><table><tr><td><p>{SITENAME}</p><a href="https://example.com" onclick="alert(1)">Click</a></td></tr></table></body></html>';
  const preview = emailPreview(source, '<Project> & {CODE}');
  assert.match(preview, /<style>p\{color:purple\}<\/style>/);
  assert.match(preview, /<body style="background:#fff">/);
  assert.match(preview, /<table>/);
  assert.match(preview, /&lt;Project&gt; &amp; \{CODE\}/);
  assert.match(preview, /default-src 'none'/);
  assert.doesNotMatch(preview, /<script|<iframe|<base|<form|<input|onclick|http-equiv="refresh"|href=/i);
});

test('wraps empty and legacy fragment previews in a document with the same policy', () => {
  for (const source of ['', '<p>{USERNAME}</p>', '<h1>Title</h1><p>{UNKNOWN}</p>']) {
    const preview = emailPreview(source, 'Project');
    assert.match(preview, /<head><meta http-equiv="Content-Security-Policy"/);
    assert.match(preview, /<body>/);
  }
});

test('only offers the text editor for simple formatting it can preserve', () => {
  for (const source of ['', 'Text', '<h1>Title</h1><p>Hello <strong>Alex</strong><br></p>']) assert.ok(isSimpleEmailTemplate(source));
  for (const source of ['<!doctype html><html><body>Text</body></html>', '<table><tr><td>Text</td></tr></table>', '<p style="color:red">Text</p>', '<div>Custom layout</div>', '<img src="logo.png">']) assert.equal(isSimpleEmailTemplate(source), false);
});
