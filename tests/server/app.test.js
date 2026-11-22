import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../../server/app.js';

let dist;
before(() => {
  dist = mkdtempSync(join(tmpdir(), 'mm-dist-'));
  writeFileSync(join(dist, 'index.html'), '<h1>home</h1>');
  writeFileSync(join(dist, '404.html'), '<h1>not found</h1>');
  mkdirSync(join(dist, 'contact', 'thanks'), { recursive: true });
  writeFileSync(join(dist, 'contact', 'thanks', 'index.html'), 'thanks');
});
after(() => rmSync(dist, { recursive: true, force: true }));

async function withServer(opts, fn) {
  const app = createApp({ distDir: dist, csp: "default-src 'self'", ...opts });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { return await fn(base); } finally { await new Promise((r) => server.close(r)); }
}

const form = (over = {}) => new URLSearchParams({ name: 'Pat', email: 'pat@example.com', role: 'new', message: 'Hello', website: '', elapsed: '', ...over }).toString();
const post = (base, body, headers = {}) => fetch(`${base}/api/contact`, {
  method: 'POST', redirect: 'manual', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
});

test('valid post sends once and redirects to thanks', async () => {
  const sent = [];
  await withServer({ sendMail: async (m) => { sent.push(m); } }, async (base) => {
    const r = await post(base, form());
    assert.equal(r.status, 303);
    assert.equal(r.headers.get('location'), '/contact/thanks/');
  });
  assert.deepEqual(sent, [{ name: 'Pat', email: 'pat@example.com', role: 'new', message: 'Hello' }]);
});

test('invalid post redirects to error and does not send', async () => {
  let n = 0;
  await withServer({ sendMail: async () => { n++; } }, async (base) => {
    const r = await post(base, form({ email: 'nope' }));
    assert.equal(r.status, 303);
    assert.equal(r.headers.get('location'), '/contact/error/?reason=invalid');
  });
  assert.equal(n, 0);
});

test('honeypot post looks like success but does not send', async () => {
  let n = 0;
  await withServer({ sendMail: async () => { n++; } }, async (base) => {
    const r = await post(base, form({ website: 'x' }));
    assert.equal(r.headers.get('location'), '/contact/thanks/');
  });
  assert.equal(n, 0);
});

test('send failure redirects to error and health stays ok', async () => {
  await withServer({ sendMail: async () => { throw new Error('resend down'); } }, async (base) => {
    const r = await post(base, form());
    assert.equal(r.headers.get('location'), '/contact/error/?reason=send');
    const h = await fetch(`${base}/api/health`);
    assert.equal(h.status, 200);
    assert.deepEqual(await h.json(), { ok: true });
  });
});

test('rate limit keys on X-Forwarded-For', async () => {
  await withServer({ sendMail: async () => {}, rateLimit: { windowMs: 60_000, limit: 5 } }, async (base) => {
    for (let i = 0; i < 5; i++) {
      const r = await post(base, form(), { 'X-Forwarded-For': '1.1.1.1' });
      assert.equal(r.headers.get('location'), '/contact/thanks/', `post ${i + 1}`);
    }
    const sixth = await post(base, form(), { 'X-Forwarded-For': '1.1.1.1' });
    assert.equal(sixth.headers.get('location'), '/contact/error/?reason=rate');
    const other = await post(base, form(), { 'X-Forwarded-For': '2.2.2.2' });
    assert.equal(other.headers.get('location'), '/contact/thanks/');
  });
});

test('body over 20 kb redirects to invalid', async () => {
  await withServer({ sendMail: async () => {} }, async (base) => {
    const r = await post(base, form({ message: 'x'.repeat(25_000) }));
    assert.equal(r.status, 303);
    assert.equal(r.headers.get('location'), '/contact/error/?reason=invalid');
  });
});

test('static pages are served', async () => {
  await withServer({ sendMail: async () => {} }, async (base) => {
    const r = await fetch(`${base}/contact/thanks/`);
    assert.equal(r.status, 200);
    assert.equal(await r.text(), 'thanks');
  });
});

test('unknown path gets 404 page', async () => {
  await withServer({ sendMail: async () => {} }, async (base) => {
    const r = await fetch(`${base}/does-not-exist`);
    assert.equal(r.status, 404);
    assert.match(await r.text(), /not found/);
  });
});
