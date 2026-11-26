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

// WCAG contrast ratio between two 6-digit hex colors.
function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, b2] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themeCss = readFileSync(new URL('../../src/styles/theme.css', import.meta.url), 'utf8');
const blocks = {
  dark: themeCss.match(/:root \{([\s\S]*?)\n\}/)[1],
  light: themeCss.match(/:root\[data-theme='light'\] \{([\s\S]*?)\n\}/)[1],
};
const cssVar = (block, name) => {
  const m = block.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\b`));
  assert.ok(m, `${name} is a 6-digit hex color`);
  return m[1];
};

for (const [theme, block] of Object.entries(blocks)) {
  test(`coverage map colors pass contrast in ${theme} theme`, () => {
    for (const under of ['--mm-map-bg', '--mm-map-road']) {
      for (const name of ['--mm-cov-reached']) {
        const r = contrast(cssVar(block, under), cssVar(block, name));
        assert.ok(r >= 3, `${name} on ${under} is ${r.toFixed(2)}:1, needs 3:1`);
      }
    }
  });
}
