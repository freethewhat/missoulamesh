import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SITE = 'http://127.0.0.1:3201/';
// The only outside requests allowed: pinned Leaflet from unpkg, and OpenStreetMap tiles.
const ALLOWED = [/^https:\/\/unpkg\.com\/leaflet@1\.9\.4\/dist\//, /^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function openMap(page, scheme = 'light') {
  const problems = [];
  page.on('console', (m) => { if (/Content Security Policy/i.test(m.text()) || m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(String(e)));
  const offsite = [];
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(SITE) && !u.startsWith('data:') && !ALLOWED.some((a) => a.test(u))) offsite.push(u); });
  await page.emulateMedia({ colorScheme: scheme });
  await page.addInitScript((s) => { try { localStorage.setItem('starlight-theme', s); } catch { /* ignore */ } }, scheme);
  await page.goto('/repeaters/');
  const map = page.locator('.mm-coverage-map');
  await expect(map).toHaveAttribute('data-ready', 'true');
  return { map, problems, offsite };
}

test('coverage map draws streets and every square, with no errors or unexpected outside requests', async ({ page }) => {
  const { map, problems, offsite } = await openMap(page);
  await expect(map).toHaveClass(/leaflet-container/);
  await expect(map.locator('.leaflet-tile-pane img.leaflet-tile-loaded').first()).toBeVisible();
  const cells = JSON.parse(await map.getAttribute('data-cells'));
  const sites = JSON.parse(await map.getAttribute('data-repeaters'));
  await expect(map.locator('.leaflet-overlay-pane path.mm-repeater-pin')).toHaveCount(sites.length);
  await expect(map.locator('.leaflet-overlay-pane path')).toHaveCount(cells.length + sites.length);
  // OpenStreetMap's tile rules require a credit on the map itself.
  await expect(map.locator('.leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]')).toHaveText('OpenStreetMap');
  await page.waitForLoadState('networkidle');
  expect(problems).toEqual([]);
  expect(offsite).toEqual([]);
});

test('coverage map follows a theme switch on the page', async ({ page }) => {
  const { map } = await openMap(page, 'light');
  await expect(map).toHaveAttribute('data-flavor', 'light');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await expect(map).toHaveAttribute('data-flavor', 'dark');
});

test('mouse wheel over the map scrolls the page, not the map', async ({ page }) => {
  const { map } = await openMap(page);
  const before = await map.locator('.leaflet-overlay-pane path').first().boundingBox();
  await map.hover();
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(400);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(400);
  const after = await map.locator('.leaflet-overlay-pane path').first().boundingBox();
  const mapBox = await map.boundingBox();
  // Squares keep their size (no zoom); the page itself moved.
  expect(Math.round(after.width)).toBe(Math.round(before.width));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  expect(mapBox).not.toBeNull();
});

test('map takes keyboard focus and zooms with the + key', async ({ page }) => {
  const { map } = await openMap(page);
  await map.focus();
  await expect(map).toBeFocused();
  const zoomIn = map.locator('.leaflet-control-zoom-in');
  await expect(zoomIn).toBeVisible();
  // Measure the square nearest the middle of the map: squares near the edge leave the view when it zooms in.
  const squares = map.locator('.leaflet-overlay-pane path:not(.mm-repeater-pin)');
  const box = await map.boundingBox();
  const mid = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const boxes = await squares.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width }; }));
  const i = boxes.reduce((best, b, j) => (Math.hypot(b.x - mid.x, b.y - mid.y) < Math.hypot(boxes[best].x - mid.x, boxes[best].y - mid.y) ? j : best), 0);
  const before = await squares.nth(i).boundingBox();
  await page.keyboard.press('+');
  await page.waitForTimeout(600);
  const after = await squares.nth(i).boundingBox();
  expect(after.width).toBeGreaterThan(before.width);
});

for (const scheme of ['light', 'dark']) {
  test(`loaded coverage map in ${scheme}: no axe violations`, async ({ page }) => {
    await openMap(page, scheme);
    const results = await new AxeBuilder({ page }).include('.mm-coverage-figure').withTags(TAGS).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('loaded coverage map at 320px has no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await openMap(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('squares line up with the street map (no page spacing pushed into the map)', async ({ page }) => {
  const { map } = await openMap(page);
  const tops = await map.evaluate((el) => {
    const top = (sel) => el.querySelector(sel).getBoundingClientRect().top;
    return { tiles: top('.leaflet-tile-pane'), squares: top('.leaflet-overlay-pane'), margin: getComputedStyle(el.querySelector('.leaflet-overlay-pane')).marginTop };
  });
  expect(tops.margin).toBe('0px');
  expect(Math.abs(tops.squares - tops.tiles)).toBeLessThan(0.5);
});

test('without JavaScript, no empty map box shows', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/repeaters/');
  await expect(page.locator('.mm-coverage-map')).toBeHidden();
  await expect(page.getByText('Other areas have not been tested yet.')).toBeVisible();
  await context.close();
});
