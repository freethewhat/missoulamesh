import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPage, pageText } from './helpers.js';
import { channelKey } from '../../src/lib/channels.js';

// /settings/ is for a new person's own device: no repeater commands, no regions.
const text = () => pageText('/settings/');

test('device settings page has the preset, path hash size, and blank region scope', () => {
  const t = text();
  assert.ok(t.includes('USA/Canada (Recommended)'));
  assert.ok(t.includes('1-byte'));
  assert.match(t, /region scope/i);
  assert.match(t, /blank/i);
});

test('device settings page lists channels with the #missoula key', () => {
  const t = text();
  for (const v of ['#missoula', '#montana', '#testing', '#emergency', 'Public']) assert.ok(t.includes(v), v);
  assert.ok(t.includes(channelKey('#missoula')));
});

test('device settings page has no repeater commands or region list', () => {
  const t = text();
  assert.ok(!t.includes('set radio'), 'set radio');
  assert.ok(!t.includes('set path.hash.mode'), 'set path.hash.mode');
  assert.ok(!t.includes('us-mt-mso'), 'regions');
});

test('device settings page links to repeater settings for repeater owners', () => {
  assert.match(readPage('/settings/'), /href="\/repeater-settings\/"/);
});

test('device settings page shows the not-yet-tested note', () => {
  assert.match(readPage('/settings/'), /class="mm-note"/);
});

test('device settings page lists the raw radio values for apps with no preset', () => {
  const t = text();
  for (const v of ['910.525', '62.5']) assert.ok(t.includes(v), v);
});

// /repeater-settings/ holds everything a repeater owner needs.
const rtext = () => pageText('/repeater-settings/');

test('repeater settings page has the radio values and set radio command', () => {
  const t = rtext();
  for (const v of ['910.525', '62.5', 'USA/Canada (Recommended)', 'set radio 910.525,62.5,7,5']) assert.ok(t.includes(v), v);
});

test('repeater settings page has the path hash command from settings', () => {
  const t = rtext();
  assert.ok(t.includes('set path.hash.mode 0'));
  assert.ok(t.includes('1-byte'));
});

test('repeater settings page lists the regions', () => {
  const t = rtext();
  for (const v of ['us-mt', 'us-mt-mso']) assert.ok(t.includes(v), v);
});

test('repeater settings page shows the untested note and FCC note', () => {
  assert.match(readPage('/repeater-settings/'), /class="mm-note"/);
  assert.ok(rtext().includes('issue #945'));
});

test('sidebar has a Run a repeater group linking repeater settings', () => {
  const h = readPage('/start/');
  assert.match(h, /Run a repeater/);
  assert.match(h, /href="\/repeater-settings\/"/);
});
