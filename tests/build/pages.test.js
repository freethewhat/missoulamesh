import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES, readPage } from './helpers.js';

for (const route of ROUTES) {
  test(`built page ${route} exists with the site title`, () => {
    const html = readPage(route);
    assert.match(html, /<title>[^<]*Missoula Mesh[^<]*<\/title>/);
  });
}
