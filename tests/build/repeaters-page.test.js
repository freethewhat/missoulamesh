import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPage, pageText, mainHtml } from './helpers.js';

test('Lewis and Clark repeater is on the air', () => {
  const html = readPage('/repeaters/');
  assert.match(html, /<li data-status="on-air"[^>]*>\s*<span class="mm-area"[^>]*>Lewis and Clark neighborhood/);
});

for (const area of ['Lewis and Clark', 'Franklin to the Fort']) {
  test(`${area} repeater has a note about the link between repeaters`, () => {
    assert.match(pageText('/repeaters/'), new RegExp(`${area} neighborhood.*Note: Both repeaters are working\\. The link between them is having issues\\. We are looking to add more repeaters\\.`));
  });
}

test('legend explains the Testing label', () => {
  assert.match(pageText('/repeaters/'), /Testing: it is up, but we are still checking it\./);
});

test('repeaters page shows no checked dates', () => {
  assert.ok(!/Last checked/.test(pageText('/repeaters/')));
});

test('repeaters page says it shows areas, not exact locations', () => {
  assert.match(pageText('/repeaters/'), /not exact locations/i);
});

test('repeaters page invites valley operators to the contact page', () => {
  assert.match(readPage('/repeaters/'), /<a href="\/contact\/"[^>]*>Run a MeshCore repeater in the valley\?/);
});


test('Lewis and Clark repeater shows its name MSO_LNC_MM_001', () => {
  assert.match(pageText('/repeaters/'), /Lewis and Clark neighborhood.*Name: MSO_LNC_MM_001/);
});

test('Franklin to the Fort repeater is listed with its name', () => {
  const t = pageText('/repeaters/');
  assert.ok(t.includes('Franklin to the Fort neighborhood'));
  assert.match(t, /Franklin to the Fort neighborhood.*Name: MSLAMT_MTC_Repeater_BASE/);
});

test('Franklin to the Fort repeater is on the air', () => {
  const html = readPage('/repeaters/');
  assert.match(html, /<li data-status="on-air"[^>]*>\s*<span class="mm-area"[^>]*>Franklin to the Fort neighborhood/);
});

const mapDiv = () => mainHtml('/repeaters/').match(/<div[^>]*class="mm-coverage-map[^"]*"[^>]*>/)?.[0];
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&amp;/g, '&');

test('coverage map is on the repeaters page, before the list', () => {
  const h = mainHtml('/repeaters/');
  assert.ok(mapDiv(), 'map element');
  assert.ok(h.indexOf('mm-coverage-map') < h.indexOf('mm-repeaters'));
});

test('map element carries every coverage square', () => {
  const m = mapDiv().match(/data-cells="([^"]*)"/);
  assert.ok(m, 'data-cells');
  const cells = JSON.parse(decode(m[1]));
  assert.equal(cells.length, 77);
  assert.ok(cells.every((c) => typeof c.lat === 'number' && typeof c.lon === 'number'));
});

test('map has an accessible name that points to the summary', () => {
  assert.match(mapDiv(), /aria-label="[^"]*[Ss]ummary[^"]*"/);
});

test('coverage map has legend, date, summary, and credits as page text', () => {
  const t = pageText('/repeaters/');
  assert.match(t, /Reached a repeater/);
  assert.doesNotMatch(t, /No reply/);
  assert.match(t, /Last updated Nov 26, 2026\. Coverage changes with weather, hills, and your antenna, so treat this as a rough guide\./);
  assert.doesNotMatch(t, /driving around/);
  assert.match(t, /Other areas have not been tested yet\./);
  assert.match(t, /Coverage data: MeshMapper/);
  assert.match(t, /© OpenStreetMap contributors/);
  const h = mainHtml('/repeaters/');
  assert.match(h, /href="https:\/\/www\.openstreetmap\.org\/copyright"/);
  assert.match(h, /href="https:\/\/meshmapper\.net\/"/);
});

test('Leaflet loads from unpkg pinned to 1.9.4 with integrity checks', () => {
  const h = readPage('/repeaters/');
  assert.match(h, /<link[^>]+href="https:\/\/unpkg\.com\/leaflet@1\.9\.4\/dist\/leaflet\.css"[^>]+integrity="sha256-p4NxAoJBhIIN\+hmNHrzRCf9tD\/miZyoHS5obTRR9BMY="[^>]*crossorigin/);
  assert.match(h, /<script[^>]+src="https:\/\/unpkg\.com\/leaflet@1\.9\.4\/dist\/leaflet\.js"[^>]+integrity="sha256-20nQCchB9co0qIjJZRGuk2\/Z9VM\+kNiyxNV1lvTlZBo="[^>]*crossorigin/);
});

test('only the repeaters page loads Leaflet', () => {
  assert.doesNotMatch(readPage('/'), /unpkg\.com/);
});

test('coverage map has no repeater markers', () => {
  assert.doesNotMatch(mainHtml('/repeaters/'), /mm-coverage-repeater|<circle/);
});

test('page is called Repeaters and coverage', () => {
  const h = readPage('/repeaters/');
  assert.match(h, /<h1[^>]*>Repeaters and coverage<\/h1>/);
  assert.match(h, /<title>Repeaters and coverage/);
  assert.match(h, /<meta name="description" content="[^"]*coverage map[^"]*"/);
});

test('coverage map has its own heading to link to', () => {
  const h = mainHtml('/repeaters/');
  assert.match(h, /<h2 id="coverage-map">Coverage map<\/h2>/);
  assert.ok(h.indexOf('id="coverage-map"') < h.indexOf('mm-coverage-map'));
});

test('menu has one entry for repeaters and coverage', () => {
  const h = readPage('/faq/');
  assert.match(h, /<a href="\/repeaters\/"[^>]*>\s*<span[^>]*>Repeaters and coverage<\/span>/);
  assert.doesNotMatch(h, /<span[^>]*>Coverage map<\/span>/);
});

test('home page links to the coverage map', () => {
  assert.match(mainHtml('/'), /<a href="\/repeaters\/#coverage-map">coverage map<\/a>/);
});
