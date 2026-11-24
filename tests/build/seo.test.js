import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, ROUTES, readPage } from './helpers.js';

const PRIVATE = ['/contact/thanks/', '/contact/error/'];

test('robots.txt points to the sitemap', () => {
  const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
  assert.match(robots, /^Sitemap: https:\/\/missoulamesh\.org\/sitemap-index\.xml$/m);
});

test('preview image and logo are in the build', () => {
  assert.ok(existsSync(join(DIST, 'og-image.png')));
  assert.ok(existsSync(join(DIST, 'logo.png')));
});

for (const route of ROUTES) {
  test(`${route} has a link-preview image`, () => {
    assert.match(readPage(route), /<meta property="og:image" content="https:\/\/missoulamesh\.org\/og-image\.png"/);
  });
}

for (const route of PRIVATE) {
  test(`${route} is noindex and not in the sitemap`, () => {
    assert.match(readPage(route), /<meta name="robots" content="noindex"/);
    assert.ok(!readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8').includes(route));
  });
}

test('public pages are in the sitemap and indexable', () => {
  const sitemap = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
  for (const route of ROUTES.filter((r) => !PRIVATE.includes(r))) {
    assert.ok(sitemap.includes(`<loc>https://missoulamesh.org${route}</loc>`), route);
    assert.doesNotMatch(readPage(route), /name="robots"/, route);
  }
});

test('home page has a search title and valid structured data', () => {
  const html = readPage('/');
  assert.match(html, /<title>Missoula Mesh: MeshCore off-grid texting in Missoula, Montana<\/title>/);
  assert.match(html, /<meta property="og:type" content="website"/);
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(ld['@graph'].find((n) => n['@type'] === 'Organization').name, 'Missoula Mesh');
});
