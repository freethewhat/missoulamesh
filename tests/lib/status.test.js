import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectiveStatus } from '../../src/lib/status.js';

test('recent check keeps stored status', () => {
  assert.deepEqual(effectiveStatus({ status: 'on-air', lastChecked: '2026-11-01' }, new Date('2026-11-22')), { status: 'on-air', stale: false });
});

test('check older than 30 days becomes unknown and stale', () => {
  assert.deepEqual(effectiveStatus({ status: 'on-air', lastChecked: '2026-11-01' }, new Date('2026-12-15')), { status: 'unknown', stale: true });
});

test('exactly 30 days old is still fresh', () => {
  assert.deepEqual(effectiveStatus({ status: 'testing', lastChecked: '2026-11-01' }, new Date('2026-12-01')), { status: 'testing', stale: false });
});

test('a future lastChecked counts as fresh', () => {
  assert.deepEqual(effectiveStatus({ status: 'testing', lastChecked: '2027-01-01' }, new Date('2026-11-22')), { status: 'testing', stale: false });
});
