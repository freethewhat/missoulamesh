import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readPage, pageText, pagePath } from './helpers.js';
import { channelKey } from '../../src/lib/channels.js';
import settings from '../../src/data/settings.json' with { type: 'json' };

const text = () => pageText('/settings/');

test('device settings page has the preset, path hash size, and blank region scope', () => {
  const t = text();
  assert.ok(t.includes('USA/Canada (Recommended)'));
  assert.ok(t.includes('1-byte'));
  assert.match(t, /region scope/i);
  assert.match(t, /blank/i);
});

test('device settings page has the full radio settings table for nodes', () => {
  const h = readPage('/settings/');
  assert.match(h, /<table/);
  const t = text();
  for (const v of ['910.525 MHz', '62.5 kHz', 'Spreading factor', 'Coding rate']) assert.ok(t.includes(v), v);
});

test('device settings page lists channels with the #missoula key', () => {
  const t = text();
  for (const v of ['#missoula', '#testing', '#emergency', 'Public']) assert.ok(t.includes(v), v);
  assert.ok(!t.includes('#montana'), 'no #montana channel');
  assert.ok(t.includes(channelKey('#missoula')));
});

test('device settings page has no repeater commands or region list', () => {
  const t = text();
  assert.ok(!t.includes('set radio'), 'set radio');
  assert.ok(!t.includes('set path.hash.mode'), 'set path.hash.mode');
  assert.ok(!t.includes('us-mt'), 'regions');
  assert.doesNotMatch(readPage('/settings/'), /repeater-settings/);
});

test('device settings page shows the not-yet-tested note and FCC note', () => {
  assert.match(readPage('/settings/'), /class="mm-note"/);
  assert.ok(text().includes('issue #945'));
});

test('there is no repeater settings page or Run a repeater menu', () => {
  assert.equal(existsSync(pagePath('/repeater-settings/')), false);
  assert.doesNotMatch(readPage('/start/'), /Run a repeater/);
});

test('device settings page says what each channel is for', () => {
  const t = pageText('/settings/');
  for (const c of settings.channels) assert.ok(t.includes(c.purpose), c.name);
});
