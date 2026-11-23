import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPage, pageText } from './helpers.js';
import hardware from '../../src/data/hardware.json' with { type: 'json' };

const companions = hardware.filter((d) => d.role === 'companion');
const esc = (s) => s.replace(/[.?()[\]/+*$^]/g, '\\$&');

// Split the page at the second section heading.
function sections() {
  const h = readPage('/hardware/');
  const valley = h.search(/<h2[^>]*>Used in the valley<\/h2>/);
  const other = h.search(/<h2[^>]*>Other popular picks \(not yet tried here\)<\/h2>/);
  assert.ok(valley > -1 && other > valley, 'both section headings, in order');
  return { tried: h.slice(valley, other), notTried: h.slice(other) };
}

test('hardware page is called What to buy', () => {
  assert.match(readPage('/hardware/'), /<h1[^>]*>What to buy<\/h1>/);
});

test('each companion is in the section that matches triedHere', () => {
  const { tried, notTried } = sections();
  for (const d of companions) {
    const [yes, no] = d.triedHere ? [tried, notTried] : [notTried, tried];
    assert.ok(yes.includes(d.name), `${d.name} in its section`);
    assert.ok(!no.includes(d.name), `${d.name} not in the other section`);
  }
});

test('each companion links its store and shows price and checked date', () => {
  const h = readPage('/hardware/');
  const t = pageText('/hardware/');
  for (const d of companions) {
    assert.match(h, new RegExp(`<a[^>]+href="${esc(d.url)}"`), `${d.name} link`);
    assert.ok(t.includes(`about $${Math.round(d.priceUSD)}`), `${d.name} price`);
    assert.ok(t.includes(`checked ${d.lastChecked}`), `${d.name} date`);
  }
});

test('hardware page has the buying tips', () => {
  const t = pageText('/hardware/');
  for (const v of ['915 MHz', 'antenna', 'earn nothing']) assert.ok(t.includes(v), v);
});

