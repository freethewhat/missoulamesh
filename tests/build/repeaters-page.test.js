import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPage, pageText } from './helpers.js';

test('repeaters page lists the Lewis and Clark repeater as testing', () => {
  const html = readPage('/repeaters/');
  assert.ok(pageText('/repeaters/').includes('Lewis and Clark neighborhood'));
  assert.match(html, /mm-tag--testing/);
  assert.match(html, /data-last-checked="2026-11-22"/);
  assert.match(html, /data-status="testing"/);
});

test('repeaters page shows the last checked date', () => {
  assert.match(pageText('/repeaters/'), /Last checked 2026-11-22/);
});

test('repeaters page says it shows areas, not exact locations', () => {
  assert.match(pageText('/repeaters/'), /not exact locations/i);
});

test('repeaters page invites valley operators to the contact page', () => {
  assert.match(readPage('/repeaters/'), /<a href="\/contact\/"[^>]*>Run a MeshCore repeater in the valley\?/);
});

test('repeater list is wrapped in the mm-repeaters element that runs the stale check', () => {
  assert.match(readPage('/repeaters/'), /<mm-repeaters[\s>]/);
});
