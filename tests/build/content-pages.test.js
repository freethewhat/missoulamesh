import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPage, pageText, mainHtml } from './helpers.js';

const link = (html, href, text) => new RegExp(`<a[^>]+href="${href.replace(/[.?]/g, '\\$&')}"[^>]*>\\s*${text.replace(/[.?]/g, '\\$&')}`).test(html);

test('home has the hero line', () => {
  assert.ok(pageText('/').includes('Off-grid text messages, built by neighbors in the Missoula Valley.'));
});
test('home has the tagline', () => {
  assert.ok(pageText('/').includes('Western Montana MeshCore'));
});
test('home buttons go to join and FAQ', () => {
  const h = readPage('/');
  assert.ok(link(h, '/start/', 'Join the mesh'), 'join button');
  assert.ok(link(h, '/faq/', 'FAQ'), 'FAQ button');
});

test('FAQ answers the common questions', () => {
  const h = readPage('/faq/');
  for (const q of ['What is MeshCore?', 'Why would I use MeshCore?', 'How does it work?', 'Do I need a license?', 'What does it cost?', 'Is it private?', 'Can I use it in an emergency?']) {
    assert.match(h, new RegExp(`<h2[^>]*>${q.replace(/[?]/g, '\\$&')}</h2>`), q);
  }
});
test('FAQ links to join', () => {
  assert.match(readPage('/faq/'), /href="\/start\/"/);
});
test('start page is called Join the mesh', () => {
  assert.match(readPage('/start/'), /<h1[^>]*>Join the mesh<\/h1>/);
});
test('home shows the compact repeater list', () => {
  const h = readPage('/');
  assert.match(h, /<ul class="mm-repeaters"/);
  assert.ok(pageText('/').includes('Lewis and Clark neighborhood'));
  assert.ok(!pageText('/').includes('MSO_LNC_MM_001'), 'compact list hides details');
});
test('home says the network is small', () => {
  assert.match(pageText('/'), /a small network/);
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
  const want = [/What you need[\s\S]*\/hardware\/[\s\S]*play\.google\.com[\s\S]*apps\.apple\.com[\s\S]*app\.meshcore\.nz/, /repeater list/, /flasher\.meshcore\.io/, /USA\/Canada \(Recommended\)/, /#missoula/, /reply/, /\/help\/[\s\S]*\/contact\//];
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
test('start has no untested note', () => {
  assert.doesNotMatch(readPage('/start/'), /class="mm-note"/);
});

test('meshtastic page links only the Ravalli Mesh home page', () => {
  const links = [...readPage('/meshtastic/').matchAll(/href="(https:\/\/[^"]*ravallimesh\.org[^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(links)], ['https://ravallimesh.org/']);
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

test('FAQ links to hardware', () => {
  assert.match(mainHtml('/faq/'), /href="\/hardware\/"/);
});
test('FAQ privacy lists what not to post', () => {
  const t = pageText('/faq/').toLowerCase();
  for (const v of ['home address', 'away from home', 'passwords', 'phone numbers']) assert.ok(t.includes(v), v);
});
