import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readPage, pageText, mainHtml, DIST } from './helpers.js';
import room from '../../src/data/room-server.json' with { type: 'json' };

const R = '/room/';

test('room page says it is an experiment', () => {
  assert.match(readPage(R), /<h1[^>]*>Room server \(an experiment\)<\/h1>/);
  assert.ok(pageText(R).includes('It may change or go away.'));
});
test('room page shows the name, key, and blank password', () => {
  const t = pageText(R);
  assert.ok(t.includes(room.name), 'name');
  assert.ok(t.includes(room.publicKey), 'public key');
  assert.ok(t.includes('Leave the password blank'), 'password');
});
test('room page links the add-contact URI with type 3', () => {
  const h = mainHtml(R).replace(/&amp;/g, '&');
  assert.ok(h.includes(`href="meshcore://contact/add?name=missoulamesh.org+room&public_key=${room.publicKey.toLowerCase()}&type=3"`));
});
test('room page shows the QR image with alt text, and the file is built', () => {
  assert.match(mainHtml(R), /<img src="\/room-qr\.svg" alt="QR code to add [^"]+ as a contact"/);
  assert.ok(existsSync(join(DIST, 'room-qr.svg')), 'dist/room-qr.svg');
});
test('room page says it is near the Lewis and Clark repeater', () => {
  assert.ok(pageText(R).includes('Lewis and Clark'));
  assert.match(mainHtml(R), /href="\/repeaters\/"/);
});
test('start page points to the room', () => {
  assert.match(mainHtml('/start/'), /href="\/room\/"/);
});
