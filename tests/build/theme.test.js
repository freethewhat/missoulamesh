import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, readPage } from './helpers.js';

test('home page shows the badge logo', () => {
  assert.match(readPage('/'), /<img[^>]+badge\.[^>]*>/);
});

test('favicon.svg is published', () => {
  assert.ok(existsSync(join(DIST, 'favicon.svg')));
});

test('built CSS carries the huckleberry purple', () => {
  const dir = join(DIST, '_astro');
  const css = readdirSync(dir).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
  assert.match(css, /#4a1f73/i);
});

test('home hero has stars and foreground foothills, no mesh links', () => {
  const h = readPage('/');
  const stars = h.match(/<svg class="mm-stars"[\s\S]*?<\/svg>/);
  assert.ok(stars, 'stars layer');
  assert.ok((stars[0].match(/<circle/g) || []).length >= 30, 'at least 30 stars');
  assert.ok(!/mm-mesh|mm-nodes/.test(h), 'no mesh links');
  assert.match(h, /class="mm-foothill-near"/);
  assert.match(h, /class="mm-foothill-nearest"/);
});
