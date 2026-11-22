import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../../server/app.js';

const EXPECTED = {
  'content-security-policy': "default-src 'self'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'strict-transport-security': 'max-age=31536000',
};

test('page and contact responses carry all security headers', async () => {
  const dist = mkdtempSync(join(tmpdir(), 'mm-h-'));
  writeFileSync(join(dist, 'index.html'), 'home');
  const server = createApp({ distDir: dist, csp: "default-src 'self'", sendMail: async () => {} }).listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const responses = [
      await fetch(`${base}/`),
      await fetch(`${base}/api/contact`, { method: 'POST', redirect: 'manual', body: 'x=1', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }),
      await fetch(`${base}/api/health`),
    ];
    for (const r of responses) for (const [k, v] of Object.entries(EXPECTED)) assert.equal(r.headers.get(k), v, `${r.url} ${k}`);
  } finally {
    await new Promise((r) => server.close(r));
    rmSync(dist, { recursive: true, force: true });
  }
});
