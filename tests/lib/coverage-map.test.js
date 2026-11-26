import { test } from 'node:test';
import assert from 'node:assert/strict';
import { snapCell, uniqueCells, cellBounds } from '../../src/lib/coverage-map.js';

test('off-grid cell snaps to its square', () => {
  assert.deepEqual(snapCell(46.8551, -113.9899), { lat: 46.8531, lon: -113.9904 });
});

test('on-grid cell stays in its own square', () => {
  assert.deepEqual(snapCell(46.8531, -113.9904), { lat: 46.8531, lon: -113.9904 });
});

test('duplicate squares appear once', () => {
  assert.equal(uniqueCells([{ lat: 46.85, lon: -114 }, { lat: 46.8501, lon: -114 }]).length, 1);
});

test('uniqueCells snaps and keeps input order', () => {
  assert.deepEqual(uniqueCells([{ lat: 46.8551, lon: -113.9899 }, { lat: 46.86, lon: -114 }]), [{ lat: 46.8531, lon: -113.9904 }, { lat: 46.8585, lon: -114.00192 }]);
});

test('no cells gives no cells', () => {
  assert.deepEqual(uniqueCells([]), []);
});

test('cellBounds gives the square corners for Leaflet', () => {
  assert.deepEqual(cellBounds({ lat: 46.8531, lon: -113.9904 }), [[46.8531, -113.9904], [46.8558, -113.98656]]);
});
