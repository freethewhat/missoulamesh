import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { buildCsp, collectInlineScriptHashes } from '../../server/csp.js';

const sha = (s) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;

test('collects one hash per unique inline script and ignores src scripts', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mm-csp-'));
  try {
    const body = "document.documentElement.dataset.x='1';";
    mkdirSync(join(dir, 'a'));
    writeFileSync(join(dir, 'index.html'), `<script>${body}</script><script type="module" src="/_astro/x.js"></script>`);
    writeFileSync(join(dir, 'a', 'index.html'), `<script is:inline>${body}</script>`.replace(' is:inline', ''));
    const hashes = await collectInlineScriptHashes(dir);
    assert.deepEqual(hashes, [sha(body)]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('collects inline scripts that carry attributes', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mm-csp-'));
  try {
    writeFileSync(join(dir, 'index.html'), '<script type="module">a()</script><script data-x="1">b()</script>');
    assert.deepEqual((await collectInlineScriptHashes(dir)).sort(), [sha('a()'), sha('b()')].sort());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('policy allows only self, given hashes, and wasm eval', () => {
  const csp = buildCsp(["'sha256-abc'"]);
  assert.doesNotMatch(csp, /http/);
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self' 'sha256-abc' 'wasm-unsafe-eval'/);
  assert.match(csp, /form-action 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
});
