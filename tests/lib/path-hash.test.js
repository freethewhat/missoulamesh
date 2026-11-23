import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathHashLabel } from '../../src/lib/path-hash.js';

test('mode 0 is 1-byte', () => { assert.equal(pathHashLabel(0), '1-byte'); });
test('mode 1 is 2-byte', () => { assert.equal(pathHashLabel(1), '2-byte'); });
test('mode 2 is 3-byte', () => { assert.equal(pathHashLabel(2), '3-byte'); });
