import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPage, pageText } from './helpers.js';

test('repeaters page lists the Lewis and Clark repeater as testing', () => {
  const html = readPage('/repeaters/');
  assert.ok(pageText('/repeaters/').includes('Lewis and Clark neighborhood'));
  assert.match(html, /mm-tag--testing/);
  assert.match(html, /data-status="testing"/);
});

test('repeaters page shows no checked dates', () => {
  assert.ok(!/Last checked/.test(pageText('/repeaters/')));
});

test('repeaters page says it shows areas, not exact locations', () => {
  assert.match(pageText('/repeaters/'), /not exact locations/i);
});

test('repeaters page invites valley operators to the contact page', () => {
  assert.match(readPage('/repeaters/'), /<a href="\/contact\/"[^>]*>Run a MeshCore repeater in the valley\?/);
});


test('Lewis and Clark repeater shows its name MSO_LNC_MM_001', () => {
  assert.match(pageText('/repeaters/'), /Lewis and Clark neighborhood.*Name: MSO_LNC_MM_001/);
});

test('Franklin to the Fort repeater is listed with its name', () => {
  const t = pageText('/repeaters/');
  assert.ok(t.includes('Franklin to the Fort neighborhood'));
  assert.match(t, /Franklin to the Fort neighborhood.*Name: MSLAMT_MTC_Repeater_BASE/);
});

test('Franklin to the Fort repeater is on the air', () => {
  const html = readPage('/repeaters/');
  assert.match(html, /<li data-status="on-air"[^>]*>\s*<span class="mm-area"[^>]*>Franklin to the Fort neighborhood/);
});
