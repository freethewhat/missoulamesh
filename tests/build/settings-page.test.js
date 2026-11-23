import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPage, pageText } from './helpers.js';
import { channelKey } from '../../src/lib/channels.js';

const text = () => pageText('/settings/');

test('settings page shows radio values from settings.json', () => {
  const t = text();
  for (const v of ['910.525', '62.5', 'USA/Canada (Recommended)', 'set radio 910.525,62.5,7,5']) assert.ok(t.includes(v), v);
});

test('settings page lists regions and channels', () => {
  const t = text();
  for (const v of ['us-mt', 'us-mt-mso', '#missoula', '#montana', '#testing', '#emergency', 'Public']) assert.ok(t.includes(v), v);
});

test('settings page shows the computed key for #missoula', () => {
  assert.ok(text().includes(channelKey('#missoula')));
});

test('settings page shows the not-yet-tested note while tested is false', () => {
  assert.match(readPage('/settings/'), /class="mm-note"/);
  assert.match(text(), /not yet tested locally/i);
});

test('settings page shows the FCC note', () => {
  assert.ok(text().includes('issue #945'));
});

test('settings page shows the path hash size from settings.json (1-byte) and its command', () => {
  const t = text();
  assert.ok(t.includes('1-byte'), '1-byte');
  assert.ok(t.includes('set path.hash.mode 0'), 'cli');
  assert.ok(!t.includes('2-byte'), 'no stale 2-byte');
});
