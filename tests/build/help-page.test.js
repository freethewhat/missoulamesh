import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPage, pageText, mainHtml } from './helpers.js';

const R = '/help/';

test('help page is called When it does not work', () => {
  assert.match(readPage(R), /<h1[^>]*>When it does not work<\/h1>/);
});
test('help page lists the symptoms in order', () => {
  const h = readPage(R);
  const want = ['The app cannot find the radio', 'The flasher cannot see the radio', 'No reply on #missoula', 'No repeaters in my list', 'Start fresh', 'Still stuck?'];
  const got = [...h.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1]);
  assert.deepEqual(got.filter((g) => want.includes(g)), want);
});
test('help page has the key fixes', () => {
  const t = pageText(R);
  for (const v of ['123456', 'Chrome or Edge', 'data', 'Advert', 'clock', 'identity']) assert.ok(t.includes(v), v);
});
test('help page links settings, repeaters, contact, and the MeshCore FAQ', () => {
  const h = mainHtml(R);
  for (const href of ['/settings/', '/repeaters/', '/contact/', 'https://docs.meshcore.io/faq/']) {
    assert.match(h, new RegExp(`href="${href.replace(/[./]/g, '\\$&')}"`), href);
  }
});
