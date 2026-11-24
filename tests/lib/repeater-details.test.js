import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repeaterDetails } from '../../src/lib/repeater-details.js';

const base = { id: 'x', name: null, area: 'Rattlesnake', status: 'on-air', contact: null };

test('contact is listed when set', () => {
  assert.deepEqual(repeaterDetails({ ...base, contact: 'KE7ABC on #missoula' }), [{ label: 'Contact', value: 'KE7ABC on #missoula' }]);
});
test('name then contact, nulls skipped', () => {
  assert.deepEqual(repeaterDetails({ ...base, name: 'MSO-RS-RC-1A2B', contact: 'email us' }).map((d) => d.label), ['Name', 'Contact']);
});
test('nothing set gives no details', () => {
  assert.deepEqual(repeaterDetails(base), []);
});
test('note is listed last when set', () => {
  assert.deepEqual(repeaterDetails({ ...base, name: 'A', contact: 'B', note: 'Link is shaky.' }).map((d) => d.label), ['Name', 'Contact', 'Note']);
});
