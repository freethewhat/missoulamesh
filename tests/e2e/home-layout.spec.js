import { test, expect } from '@playwright/test';

// Home page, wide screen: both headings share a line, the map lines up with the blurb beside it, and the legend sits close under the map.
test.use({ viewport: { width: 1280, height: 900 } });

test('home map lines up with the blurb, legend sits right under it', async ({ page }) => {
  await page.goto('/');
  const map = page.locator('.mm-intro .mm-coverage-map');
  await expect(map).toHaveAttribute('data-ready', 'true');
  const blurb = await page.locator('.mm-intro-text').boundingBox();
  const h1 = await page.locator('.mm-intro-head h2').boundingBox();
  const h2 = await page.locator('.mm-intro-maphead h2').boundingBox();
  expect(Math.abs(h1.y + h1.height - (h2.y + h2.height))).toBeLessThanOrEqual(2); // headings end on the same line
  const m = await map.boundingBox();
  expect(Math.abs(m.y - blurb.y)).toBeLessThanOrEqual(2);
  expect(Math.abs(m.y + m.height - (blurb.y + blurb.height))).toBeLessThanOrEqual(2);

  const legend = await page.locator('.mm-intro .mm-cov-legend').boundingBox();
  expect(legend.y - (m.y + m.height)).toBeLessThanOrEqual(12);
});

test('legend icons sit level with their words', async ({ page }) => {
  await page.goto('/');
  const items = page.locator('.mm-cov-legend li');
  for (let i = 0; i < await items.count(); i++) {
    const li = await items.nth(i).boundingBox();
    const svg = await items.nth(i).locator('svg').boundingBox();
    const liMid = li.y + li.height / 2;
    const svgMid = svg.y + svg.height / 2;
    expect(Math.abs(liMid - svgMid)).toBeLessThanOrEqual(2);
  }
});
