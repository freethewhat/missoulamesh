import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repeaterDetails } from '../../src/lib/repeater-details.js';

const base = { id: 'x', name: null, area: 'Rattlesnake', status: 'on-air', lastChecked: '2026-11-22', contact: null, notes: null };

test('contact is listed when set', () => {
  assert.deepEqual(repeaterDetails({ ...base, contact: 'KE7ABC on #missoula' }), [{ label: 'Contact', value: 'KE7ABC on #missoula' }]);
});
test('name, contact, notes in order, nulls skipped', () => {
  assert.deepEqual(repeaterDetails({ ...base, name: 'MSO-RS-RC-1A2B', contact: 'email us', notes: 'Solar' }).map((d) => d.label), ['Name', 'Contact', 'Notes']);
});
test('nothing set gives no details', () => {
  assert.deepEqual(repeaterDetails(base), []);
});
