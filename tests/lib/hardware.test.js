import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickHardware } from '../../src/lib/hardware.js';

const list = [
  { id: 'a', role: 'companion', triedHere: true },
  { id: 'b', role: 'companion', triedHere: false },
  { id: 'c', role: 'repeater', triedHere: true },
  { id: 'd', role: 'repeater', triedHere: true },
];

test('pickHardware filters by role and triedHere', () => {
  assert.deepEqual(pickHardware(list, { role: 'companion', triedHere: false }).map((d) => d.id), ['b']);
});
test('pickHardware returns an empty list when nothing matches', () => {
  assert.deepEqual(pickHardware(list.slice(0, 1), { role: 'companion', triedHere: false }), []);
});
test('pickHardware with ids returns only those devices, in id order', () => {
  assert.deepEqual(pickHardware(list, { ids: ['d'] }).map((d) => d.id), ['d']);
});
