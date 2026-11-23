import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { settingsSchema, repeatersSchema, hardwareSchema } from '../../src/lib/schemas.js';

const load = (f) => JSON.parse(readFileSync(new URL(`../../src/data/${f}`, import.meta.url)));
const settings = load('settings.json');
const repeaters = load('repeaters.json');
const clone = (o) => structuredClone(o);

test('real settings.json passes', () => { settingsSchema.parse(settings); });
test('real repeaters.json passes', () => { repeatersSchema.parse(repeaters); });

test('coding rate 9 is rejected', () => {
  const s = clone(settings); s.radio.codingRate = 9;
  assert.equal(settingsSchema.safeParse(s).success, false);
});
test('spreading factor 13 is rejected', () => {
  const s = clone(settings); s.radio.spreadingFactor = 13;
  assert.equal(settingsSchema.safeParse(s).success, false);
});
test('impossible lastChecked date is rejected', () => {
  const r = clone(repeaters); r[0].lastChecked = '2026-13-40';
  assert.equal(repeatersSchema.safeParse(r).success, false);
});
test('Feb 30 lastChecked is rejected', () => {
  const r = clone(repeaters); r[0].lastChecked = '2026-02-30';
  assert.equal(repeatersSchema.safeParse(r).success, false);
});
test('unknown status is rejected', () => {
  const r = clone(repeaters); r[0].status = 'up';
  assert.equal(repeatersSchema.safeParse(r).success, false);
});
test('missing area is rejected', () => {
  const r = clone(repeaters); delete r[0].area;
  assert.equal(repeatersSchema.safeParse(r).success, false);
});

const hardware = () => load('hardware.json');
test('real hardware.json passes', () => { hardwareSchema.parse(hardware()); });
test('hardware URL with a query string (affiliate tag) is rejected', () => {
  const h = clone(hardware()); h[0].url += '?ref=x';
  assert.equal(hardwareSchema.safeParse(h).success, false);
});
test('hardware role router is rejected', () => {
  const h = clone(hardware()); h[0].role = 'router';
  assert.equal(hardwareSchema.safeParse(h).success, false);
});
test('hardware Feb 30 lastChecked is rejected', () => {
  const h = clone(hardware()); h[0].lastChecked = '2026-02-30';
  assert.equal(hardwareSchema.safeParse(h).success, false);
});
