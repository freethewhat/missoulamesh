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
test('home shows the blurb beside the map, then the join steps as cards', () => {
  const h = readPage('/');
  const intro = h.indexOf('class="mm-intro"');
  assert.ok(intro > -1, 'mm-intro');
  assert.ok(intro < h.indexOf('a small network'));
  assert.ok(h.indexOf('a small network') < h.indexOf('mm-coverage-map'));
  assert.ok(h.indexOf('mm-coverage-map') < h.indexOf('Join in three steps'));
  assert.match(h, /<ol class="mm-steps mm-steps--cards">/);
  assert.match(h, /mm-coverage-figure--compact/);
  assert.match(h, /<h2[^>]*>What is MeshCore\?<\/h2>/);
  assert.match(h, /<h2[^>]*>Where the mesh reaches<\/h2>/);
  assert.ok(h.indexOf('What is MeshCore?') < h.indexOf('a small network'));
  assert.ok(h.indexOf('Where the mesh reaches') < h.indexOf('mm-coverage-map'));
  assert.match(pageText('/'), /The map shows where people have reached a repeater so far\. Coverage changes with hills, weather, and your antenna\./);
  assert.doesNotMatch(h, /<ul class="mm-repeaters"/);
  assert.ok(link(h, '/repeaters/', 'repeater list'));
  for (const href of ['/hardware/', '/settings/', '/start/', '/contact/']) assert.match(h, new RegExp(`href="${href}"`), href);
});
test('home map has the legend but no last-updated line', () => {
  const t = pageText('/');
  assert.match(t, /Reached a repeater/);
  assert.doesNotMatch(t, /Last updated/);
  assert.match(pageText('/repeaters/'), /Last updated/);
});
test('home says the network is small', () => {
  assert.match(pageText('/'), /a small network/);
});
test('home invites valley operators to contact', () => {
  assert.ok(link(readPage('/'), '/contact/', 'Already running MeshCore in the valley?'));
});

test('start has 4 steps in order', () => {
  const h = readPage('/start/');
  const ol = h.match(/<ol class="mm-steps">([\s\S]*?)<\/ol>/);
  assert.ok(ol, 'mm-steps list');
  const items = ol[1].split(/<li[\s>]/).slice(1);
  assert.equal(items.length, 4);
  const want = [/What you need[\s\S]*\/hardware\/[\s\S]*play\.google\.com[\s\S]*apps\.apple\.com[\s\S]*app\.meshcore\.nz/, /flasher\.meshcore\.io/, /USA\/Canada \(Recommended\)/, /#missoula[\s\S]*reply/];
  want.forEach((re, i) => assert.match(items[i], re, `step ${i + 1}`));
});
test('start does not ask people to find a repeater first', () => {
  assert.doesNotMatch(mainHtml('/start/'), /href="\/repeaters\/"/);
});
test('start sets path hash size from settings (1-byte) and blank region scope', () => {
  const t = pageText('/start/');
  assert.match(t, /1-byte/);
  assert.doesNotMatch(t, /2-byte/);
  assert.match(t, /region scope/i);
});
test('start links the flasher, the pair step anchor, and help', () => {
  const h = readPage('/start/');
  assert.match(h, /href="https:\/\/flasher\.meshcore\.io\/?"/);
  assert.match(h, /<li id="pair"/);
  assert.match(h, /href="\/help\/"/);
  assert.match(h, /href="\/contact\/"/);
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
test('meshtastic page explains how to switch a Meshtastic radio to MeshCore', () => {
  const h = readPage('/meshtastic/');
  assert.match(h, /<h2 id="already-have-a-meshtastic-radio"/);
  assert.match(h, /href="https:\/\/flasher\.meshcore\.io\/?"/);
  assert.match(h, /href="\/start\/#pair"/);
  assert.match(h, /href="https:\/\/flasher\.meshtastic\.org\/?"/);
});
test('faq answers the reflash question and links the meshtastic page', () => {
  const h = readPage('/faq/');
  assert.match(pageText('/faq/'), /Can I put MeshCore on my Meshtastic radio\?/);
  assert.match(h, /href="\/meshtastic\/#already-have-a-meshtastic-radio"/);
});
test('start has a sidebar for Meshtastic owners', () => {
  const h = readPage('/start/');
  const aside = h.match(/<aside[^>]*starlight-aside[\s\S]*?<\/aside>/);
  assert.ok(aside, 'aside');
  assert.match(aside[0], /Meshtastic/);
  assert.match(aside[0], /href="\/meshtastic\/#already-have-a-meshtastic-radio"/);
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
test('home map name does not point to a summary the home page lacks', () => {
  const label = readPage('/').match(/class="mm-coverage-map[^"]*"[^>]*aria-label="([^"]*)"/)?.[1] ?? '';
  assert.ok(label, 'aria-label');
  assert.doesNotMatch(label, /summary below/i);
  assert.match(label, /repeater list/i);
});
