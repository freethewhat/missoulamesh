import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findExternalResources, findExternalCss, ALLOWED_RESOURCES } from '../../scripts/check-external.js';

test('CDN script is flagged', () => {
  assert.equal(findExternalResources('<script src="https://cdn.x/a.js"></script>').length, 1);
});
test('Google Fonts stylesheet is flagged', () => {
  assert.equal(findExternalResources('<link rel="stylesheet" href="https://fonts.googleapis.com/css">').length, 1);
});
test('protocol-relative image is flagged', () => {
  assert.equal(findExternalResources('<img src="//cdn.x/a.png">').length, 1);
});
test('external srcset entry is flagged', () => {
  assert.equal(findExternalResources('<img src="/a.png" srcset="/a.png 1x, https://cdn.x/b.png 2x">').length, 1);
});
test('iframe embed is flagged', () => {
  assert.equal(findExternalResources('<iframe src="https://maps.example/embed"></iframe>').length, 1);
});
test('outside link is not flagged', () => {
  assert.equal(findExternalResources('<a href="https://ravallimesh.org/">x</a>').length, 0);
});
test('local image is not flagged', () => {
  assert.equal(findExternalResources('<img src="/a.png">').length, 0);
});
test('own-origin absolute URL is not flagged', () => {
  assert.equal(findExternalResources('<link rel="icon" href="https://missoulamesh.org/favicon.svg">').length, 0);
});
test('canonical and alternate links are not flagged', () => {
  assert.equal(findExternalResources('<link rel="canonical" href="https://other.example/">').length, 0);
});
test('CSS url() and @import to other sites are flagged', () => {
  assert.equal(findExternalCss("@import url('https://fonts.googleapis.com/x'); a{background:url(https://cdn.x/i.png)} b{background:url(/ok.png)}").length, 2);
});

// The coverage map loads Leaflet from unpkg (pinned, with SRI) and OpenStreetMap tiles. Nothing else.
test('pinned Leaflet from unpkg is allowed', () => {
  assert.equal(findExternalResources('<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">').length, 0);
});
test('other unpkg packages are still flagged', () => {
  assert.equal(findExternalResources('<script src="https://unpkg.com/other@1.0.0/x.js"></script>').length, 1);
});
test('allow list is only the pinned Leaflet files', () => {
  assert.deepEqual(ALLOWED_RESOURCES, ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js']);
});
