import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createResendSender } from '../../server/mailer.js';

const msg = { name: 'Pat', email: 'pat@example.com', role: 'experienced', message: 'I run a node.' };

function fakeFetch(status = 200) {
  const calls = [];
  const fn = async (url, init) => { calls.push({ url, init }); return new Response('{}', { status }); };
  fn.calls = calls;
  return fn;
}

test('posts to Resend with bearer key and reply-to', async () => {
  const f = fakeFetch();
  await createResendSender({ apiKey: 'k1', from: 'Missoula Mesh <contact@missoulamesh.org>', to: 'owner@gmail.com', fetchImpl: f })(msg);
  assert.equal(f.calls.length, 1);
  const { url, init } = f.calls[0];
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.Authorization, 'Bearer k1');
  const body = JSON.parse(init.body);
  assert.equal(body.from, 'Missoula Mesh <contact@missoulamesh.org>');
  assert.deepEqual(body.to, ['owner@gmail.com']);
  assert.equal(body.reply_to, 'pat@example.com');
  assert.equal(body.subject, 'Missoula Mesh contact: Already uses MeshCore from Pat');
  for (const v of ['Pat', 'pat@example.com', 'Already uses MeshCore', 'I run a node.']) assert.ok(body.text.includes(v), v);
});

test('role labels', async () => {
  for (const [role, label] of [['new', 'New to MeshCore'], ['other', 'Other']]) {
    const f = fakeFetch();
    await createResendSender({ apiKey: 'k', from: 'f', to: 't', fetchImpl: f })({ ...msg, role });
    assert.ok(JSON.parse(f.calls[0].init.body).subject.includes(label));
  }
});

test('non-2xx from Resend throws', async () => {
  await assert.rejects(createResendSender({ apiKey: 'k', from: 'f', to: 't', fetchImpl: fakeFetch(422) })(msg));
});

test('missing api key throws without calling fetch', async () => {
  const f = fakeFetch();
  await assert.rejects(createResendSender({ apiKey: '', from: 'f', to: 't', fetchImpl: f })(msg));
  assert.equal(f.calls.length, 0);
});

test('missing destination throws without calling fetch', async () => {
  const f = fakeFetch();
  await assert.rejects(createResendSender({ apiKey: 'k', from: 'f', to: undefined, fetchImpl: f })(msg));
  assert.equal(f.calls.length, 0);
});
