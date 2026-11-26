// Read a MeshMapper screenshot and add any new reply squares to src/data/coverage.json.
// How-to: docs/coverage-updates.md. Run by hand:
//   node scripts/coverage-from-screenshot.js <screenshot.png>             # dry run + check picture
//   node scripts/coverage-from-screenshot.js <screenshot.png> --write     # also update coverage.json
// Options: --as-of YYYY-MM-DD (default today), --crop x,y,w,h (ignore menus), --check <out.png>.
//
// How it works: MeshMapper draws squares on a fixed lat/lon grid (0.0027° x 0.00384°). The script finds
// that grid in the picture from the square edges, finds which squares show a reply (teal, green, purple),
// then lines the picture up by matching its squares to squares already in coverage.json. So a new
// screenshot must include some squares that are already on our map. Squares in scripts/coverage-skip.json
// are never added. Red and grey squares (no reply) are ignored.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { GRID } from '../src/lib/coverage-map.js';

const COVERAGE = 'src/data/coverage.json';
const SKIP = 'scripts/coverage-skip.json';
const MIN_FILL = 0.3; // share of a square's middle that must be reply-colored
const MIN_MATCHES = 5; // squares that must line up with the existing map

export function isReplyColor(r, g, b) {
  const teal = r < 150 && g > 170 && b > 180 && b - r > 50 && b - g < 35;
  const darkTeal = r < 135 && g - r > 40 && b - r > 30 && Math.abs(g - b) < 25 && g > 140;
  const purple = r > 150 && b > 200 && g < 170;
  const green = g - r > 60 && g - b > 60 && g > 140;
  return teal || darkTeal || purple || green;
}

function replyMask({ px, w, h, channels }, crop) {
  const mask = new Uint8Array(w * h);
  const [cx, cy, cw, ch] = crop ?? [0, 0, w, h];
  for (let y = cy; y < Math.min(h, cy + ch); y++) {
    for (let x = cx; x < Math.min(w, cx + cw); x++) {
      const o = (y * w + x) * channels;
      if (isReplyColor(px[o], px[o + 1], px[o + 2])) mask[y * w + x] = 1;
    }
  }
  return mask;
}

// Grid pitch and phase on one axis, from the positions where squares start and end.
export function fitAxis(edges, minPitch, maxPitch) {
  let best = { score: -1, pitch: 0, phase: 0 };
  for (let p = minPitch; p <= maxPitch; p += 0.005) {
    let re = 0, im = 0;
    for (const e of edges) { const a = (2 * Math.PI * e) / p; re += Math.cos(a); im += Math.sin(a); }
    const score = Math.hypot(re, im);
    if (score > best.score) {
      const phase = (((Math.atan2(im, re) / (2 * Math.PI)) * p) % p + p) % p;
      best = { score, pitch: p, phase };
    }
  }
  return { pitch: best.pitch, phase: best.phase };
}

export function detectCells(shot, { crop, minPitch = 8, maxPitch = 40 } = {}) {
  const { w, h } = shot;
  const mask = replyMask(shot, crop);
  const ex = [], ey = [];
  for (let y = 0; y < h; y++) for (let x = 1; x < w; x++) if (mask[y * w + x] !== mask[y * w + x - 1]) ex.push(x);
  for (let x = 0; x < w; x++) for (let y = 1; y < h; y++) if (mask[y * w + x] !== mask[(y - 1) * w + x]) ey.push(y);
  if (ex.length < 4 || ey.length < 4) return { cells: [], grid: null };
  const gx = fitAxis(ex, minPitch, maxPitch), gy = fitAxis(ey, minPitch, maxPitch);
  const cells = [];
  for (let i = -1; gx.phase + i * gx.pitch < w; i++) {
    for (let j = -1; gy.phase + j * gy.pitch < h; j++) {
      const x0 = Math.ceil(gx.phase + (i + 0.2) * gx.pitch), x1 = Math.floor(gx.phase + (i + 0.8) * gx.pitch);
      const y0 = Math.ceil(gy.phase + (j + 0.2) * gy.pitch), y1 = Math.floor(gy.phase + (j + 0.8) * gy.pitch);
      if (x0 < 0 || y0 < 0 || x1 >= w || y1 >= h) continue;
      let on = 0, all = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { all++; on += mask[y * w + x]; }
      if (all && on / all >= MIN_FILL) cells.push({ i, j });
    }
  }
  return { cells, grid: { pitchX: gx.pitch, phaseX: gx.phase, pitchY: gy.pitch, phaseY: gy.phase } };
}

// Picture squares (i right, j down) vs map squares (N = lon index, M = lat index, north up):
// N = i + dN, M = dM - j. The shift that lines up the most squares wins.
export function findShift(detected, existing) {
  const votes = new Map();
  for (const d of detected) for (const e of existing) {
    const k = `${e.N - d.i},${e.M + d.j}`;
    votes.set(k, (votes.get(k) ?? 0) + 1);
  }
  let best = { dN: 0, dM: 0, matches: 0 };
  for (const [k, n] of votes) if (n > best.matches) { const [dN, dM] = k.split(',').map(Number); best = { dN, dM, matches: n }; }
  return best;
}

const round5 = (n) => Math.round(n * 1e5) / 1e5;
const key = (c) => `${c.lat.toFixed(5)},${c.lon.toFixed(5)}`;

export function mergeCells(existing, found, skip) {
  const have = new Set(existing.map(key));
  const skipped = new Set(skip.map(key));
  const added = [];
  for (const c of found) {
    const k = key(c);
    if (have.has(k) || skipped.has(k)) continue;
    have.add(k);
    added.push(c);
  }
  const cells = [...existing, ...added].sort((a, b) => b.lat - a.lat || a.lon - b.lon);
  return { cells, added };
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const shotPath = process.argv[2];
  if (!shotPath || shotPath.startsWith('--')) {
    console.error('usage: node scripts/coverage-from-screenshot.js <screenshot.png> [--write] [--as-of YYYY-MM-DD] [--crop x,y,w,h] [--check out.png]');
    process.exit(2);
  }
  const { default: sharp } = await import('sharp');
  const { data, info } = await sharp(shotPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const shot = { px: data, w: info.width, h: info.height, channels: info.channels };
  const crop = arg('--crop')?.split(',').map(Number);

  const { cells: detected, grid } = detectCells(shot, { crop });
  if (!grid || detected.length === 0) throw new Error('No reply squares found in the screenshot.');

  const coverage = JSON.parse(await readFile(COVERAGE, 'utf8'));
  const skip = JSON.parse(await readFile(SKIP, 'utf8')).cells;
  const existingIdx = coverage.cells.map((c) => ({ N: Math.round(c.lon / GRID.lon), M: Math.round(c.lat / GRID.lat) }));
  const shift = findShift(detected, existingIdx);
  if (shift.matches < MIN_MATCHES) {
    throw new Error(`Only ${shift.matches} squares line up with the current map (need ${MIN_MATCHES}). Take a screenshot that includes some squares already on the map, at about the same zoom.`);
  }
  const found = detected.map(({ i, j }) => ({ lat: round5((shift.dM - j) * GRID.lat), lon: round5((i + shift.dN) * GRID.lon) }));
  const { cells, added } = mergeCells(coverage.cells, found, skip);

  console.log(`grid: ${grid.pitchX.toFixed(2)} x ${grid.pitchY.toFixed(2)} px per square`);
  console.log(`reply squares in screenshot: ${detected.length}; lined up with the map: ${shift.matches}; new: ${added.length}`);
  for (const c of added) console.log(`  + ${c.lat}, ${c.lon}`);

  // Check picture: blue = already on the map, green = new, red = skipped.
  const checkPath = arg('--check') ?? shotPath.replace(/\.[a-z]+$/i, '') + '.check.png';
  const have = new Set(coverage.cells.map(key)), skipped = new Set(skip.map(key));
  const rects = detected.map(({ i, j }, n) => {
    const c = found[n], k = key(c);
    const color = skipped.has(k) ? '#d00' : have.has(k) ? '#06f' : '#0a0';
    const x = grid.phaseX + i * grid.pitchX, y = grid.phaseY + j * grid.pitchY;
    return `<rect x="${x + 2}" y="${y + 2}" width="${grid.pitchX - 4}" height="${grid.pitchY - 4}" fill="none" stroke="${color}" stroke-width="2"/>`;
  }).join('');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${shot.w}" height="${shot.h}">${rects}</svg>`);
  await sharp(shotPath).composite([{ input: svg }]).png().toFile(checkPath);
  console.log(`check picture: ${checkPath} (blue = already on map, green = new, red = skipped)`);

  if (process.argv.includes('--write')) {
    const asOf = arg('--as-of') ?? new Date().toISOString().slice(0, 10);
    const lines = cells.map((c) => `    { "lat": ${c.lat}, "lon": ${c.lon} }`).join(',\n');
    await writeFile(COVERAGE, `{\n  "asOf": "${asOf}",\n  "source": ${JSON.stringify(coverage.source)},\n  "cells": [\n${lines}\n  ]\n}\n`);
    console.log(`wrote ${COVERAGE}: ${cells.length} squares, asOf ${asOf}`);
  } else {
    console.log('dry run: add --write to update coverage.json');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => { console.error(`coverage-from-screenshot: ${e.message}`); process.exit(1); });
}
