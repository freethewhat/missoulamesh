import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPage, pageText, mainHtml } from './helpers.js';
import { pathHashLabel } from '../../src/lib/path-hash.js';
import settings from '../../src/data/settings.json' with { type: 'json' };

const R = '/host-a-repeater/';
// Text of the main content only (no menu or footer).
const mainText = () => {
  const m = readPage(R).match(/<main[\s\S]*?<\/main>/);
  assert.ok(m, 'main element');
  return m[0].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
};

test('host page title says if you want', () => {
  assert.match(readPage(R), /<h1[^>]*>Host a repeater \(if you want\)<\/h1>/);
});
test('host page takes the preset and path hash size from settings', () => {
  const t = pageText(R);
  assert.ok(t.includes(settings.radio.presetName), 'preset');
  assert.ok(t.includes(pathHashLabel(settings.pathHashMode)), 'path hash size');
});
test('host page links device settings and contact', () => {
  const h = mainHtml(R);
  assert.match(h, /href="\/settings\/"/);
  assert.match(h, /href="\/contact\/"/);
});
test('host page shows the Missoula example repeater', () => {
  const t = pageText(R);
  assert.ok(t.includes('MSO_LNC_MM_001'));
  assert.ok(t.includes('SenseCAP Solar Node P1-Pro'));
});
test('host page says to change the default admin password', () => {
  assert.match(readPage(R), /<code>password<\/code>/);
});
test('host page has the name, location, advert, and amplifier tips', () => {
  const t = pageText(R);
  for (const v of ['street address', 'rough', 'defaults', 'amplifier']) assert.ok(t.includes(v), v);
});
test('host page says must only once, about the preset', () => {
  const sentences = mainText().split(/(?<=[.!?])\s+/).filter((s) => /\bmust\b/i.test(s));
  assert.equal(sentences.length, 1, sentences.join(' | '));
  assert.match(sentences[0], /preset/i);
});
test('host page gives no repeater CLI commands', () => {
  assert.doesNotMatch(pageText(R), /\bset (name|lat|lon|freq|radio)\b/);
});
test('hardware page links the host-a-repeater page', () => {
  assert.match(mainHtml('/hardware/'), /href="\/host-a-repeater\/"/);
});
