import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { radioCli } from '../../src/lib/radio.js';

const settings = JSON.parse(readFileSync(new URL('../../src/data/settings.json', import.meta.url)));

test('radioCli builds the set radio command from settings', () => {
  assert.equal(radioCli(settings.radio), 'set radio 910.525,62.5,7,5');
});
