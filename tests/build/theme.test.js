import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, readPage } from './helpers.js';

test('home page shows the trail badge logo', () => {
  assert.match(readPage('/'), /<img[^>]+badge-light[^>]*>/);
});

test('favicon.svg is published', () => {
  assert.ok(existsSync(join(DIST, 'favicon.svg')));
});

test('built CSS carries the trail-map paper color', () => {
  const dir = join(DIST, '_astro');
  const css = readdirSync(dir).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
  assert.match(css, /#f4efe3/i);
});
