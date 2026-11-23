import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPage, pageText } from './helpers.js';

const link = (html, href, text) => new RegExp(`<a[^>]+href="${href.replace(/[.?]/g, '\\$&')}"[^>]*>\\s*${text.replace(/[.?]/g, '\\$&')}`).test(html);

test('home has the hero line', () => {
  assert.ok(pageText('/').includes('Off-grid text messages, built by neighbors in the Missoula Valley.'));
});
test('home has the tagline', () => {
  assert.ok(pageText('/').includes('Western Montana MeshCore'));
});
test('home buttons go to start and contact', () => {
  const h = readPage('/');
  assert.ok(link(h, '/start/', 'I just got a device'), 'start button');
  assert.ok(link(h, '/contact/', 'I already use MeshCore'), 'contact button');
});
test('home shows the compact repeater list', () => {
  const h = readPage('/');
  assert.match(h, /<mm-repeaters[\s>]/);
  assert.ok(pageText('/').includes('Lewis and Clark neighborhood'));
  assert.ok(!pageText('/').includes('Being tested this week'), 'compact list hides notes');
});
test('home says the network is new and small', () => {
  assert.match(pageText('/'), /new and small/);
});
test('home invites valley operators to contact', () => {
  assert.ok(link(readPage('/'), '/contact/', 'Already running MeshCore in the valley?'));
});

test('start has 7 steps in order', () => {
  const h = readPage('/start/');
  const ol = h.match(/<ol class="mm-steps">([\s\S]*?)<\/ol>/);
  assert.ok(ol, 'mm-steps list');
  const items = ol[1].split(/<li[\s>]/).slice(1);
  assert.equal(items.length, 7);
  const want = [/What you need/, /repeater list/, /flasher\.meshcore\.io/, /USA\/Canada \(Recommended\)/, /#missoula/, /reply/, /\/contact\//];
  want.forEach((re, i) => assert.match(items[i], re, `step ${i + 1}`));
});
test('start says what to do when no repeater is near', () => {
  const t = pageText('/start/');
  for (const v of ['contact form', 'repeater', 'high ground']) assert.ok(t.includes(v), v);
});
test('start sets path hash size from settings (1-byte) and blank region scope', () => {
  const t = pageText('/start/');
  assert.match(t, /1-byte/);
  assert.doesNotMatch(t, /2-byte/);
  assert.match(t, /region scope/i);
});
test('start links the repeater list and flasher', () => {
  const h = readPage('/start/');
  assert.match(h, /href="\/repeaters\/"/);
  assert.match(h, /href="https:\/\/flasher\.meshcore\.io\/?"/);
});
test('start shows the untested note', () => {
  assert.match(readPage('/start/'), /class="mm-note"/);
});

const RAVALLI = ['https://ravallimesh.org/', 'https://ravallimesh.org/join-the-community/', 'https://ravallimesh.org/new-coverage-missoula-frenchtown/', 'https://mesh.ravallimesh.org/', 'https://go.ravallimesh.org/s/chat', 'https://ravallimesh.org/best-practices/'];
test('meshtastic page links all six Ravalli Mesh pages', () => {
  const h = readPage('/meshtastic/');
  for (const u of RAVALLI) assert.ok(h.includes(`href="${u}"`), u);
});
test('meshtastic page says the radios cannot talk to each other', () => {
  assert.match(pageText('/meshtastic/'), /cannot talk to each other/);
});
test('meshtastic page copies no meetup dates', () => {
  assert.doesNotMatch(pageText('/meshtastic/'), /(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}/);
});

test('about has email, contact link, and licenses', () => {
  const h = readPage('/about/');
  const t = pageText('/about/');
  assert.ok(t.includes('hello@missoulamesh.org'));
  assert.match(h, /href="\/contact\/"/);
  assert.ok(t.includes('CC BY 4.0'));
  assert.ok(t.includes('MIT'));
});

test('home has exactly one h1', () => {
  assert.equal((readPage('/').match(/<h1[\s>]/g) || []).length, 1);
});
