import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isReplyColor, fitAxis, detectCells, findShift, mergeCells } from '../../scripts/coverage-from-screenshot.js';

// A fake screenshot: grey background with teal squares on a known grid.
function fakeShot({ w = 420, h = 320, pitchX = 16.69, pitchY = 17.165, phaseX = 5.3, phaseY = 2.1, cells }) {
  const px = new Uint8Array(w * h * 3).fill(230);
  for (const [i, j] of cells) {
    const x0 = Math.round(phaseX + i * pitchX), x1 = Math.round(phaseX + (i + 1) * pitchX) - 1;
    const y0 = Math.round(phaseY + j * pitchY), y1 = Math.round(phaseY + (j + 1) * pitchY) - 1;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px.set([123, 195, 203], (y * w + x) * 3);
  }
  return { px, w, h, channels: 3 };
}

test('teal, green, and purple squares count as replies; red, grey, roads, and paper do not', () => {
  assert.equal(isReplyColor(123, 195, 203), true); // teal
  assert.equal(isReplyColor(90, 160, 165), true); // darker teal
  assert.equal(isReplyColor(173, 146, 214), true); // purple
  assert.equal(isReplyColor(76, 175, 80), true); // green
  assert.equal(isReplyColor(197, 74, 81), false); // red
  assert.equal(isReplyColor(168, 165, 161), false); // grey
  assert.equal(isReplyColor(247, 175, 95), false); // orange road
  assert.equal(isReplyColor(247, 241, 234), false); // paper
  assert.equal(isReplyColor(150, 190, 240), false); // river blue
});

test('fitAxis finds the grid pitch and phase from square edges', () => {
  const edges = [];
  for (let k = 0; k < 20; k++) edges.push(5.3 + k * 16.69, 5.3 + (k + 1) * 16.69 - 1);
  const { pitch, phase } = fitAxis(edges.map(Math.round), 16, 19);
  assert.ok(Math.abs(pitch - 16.69) < 0.05, `pitch ${pitch}`);
  assert.ok(Math.abs(((phase - 5.3 + pitch / 2) % pitch) - pitch / 2) < 1.5, `phase ${phase}`);
});

test('detectCells finds each square on the grid', () => {
  const cells = [[2, 3], [3, 3], [4, 3], [10, 8], [11, 9], [20, 15]];
  const shot = fakeShot({ cells });
  const found = detectCells(shot).cells.map((c) => `${c.i},${c.j}`).sort();
  assert.deepEqual(found, cells.map(([i, j]) => `${i},${j}`).sort());
});

test('findShift lines new squares up with squares already on the map', () => {
  // existing: lon index N = i + 100, lat index M = 50 - j
  const detected = [{ i: 2, j: 3 }, { i: 3, j: 3 }, { i: 10, j: 8 }, { i: 30, j: 1 }];
  const existing = [{ N: 102, M: 47 }, { N: 103, M: 47 }, { N: 110, M: 42 }, { N: 500, M: 9 }];
  assert.deepEqual(findShift(detected, existing), { dN: 100, dM: 50, matches: 3 });
});

test('mergeCells adds only new squares, keeps old ones, and never adds skipped ones', () => {
  const existing = [{ lat: 46.8531, lon: -113.9904 }];
  const found = [{ lat: 46.8531, lon: -113.9904 }, { lat: 46.8558, lon: -113.9904 }, { lat: 46.9, lon: -114.0 }];
  const skip = [{ lat: 46.9, lon: -114.0 }];
  const { cells, added } = mergeCells(existing, found, skip);
  assert.equal(cells.length, 2);
  assert.deepEqual(added, [{ lat: 46.8558, lon: -113.9904 }]);
});
