import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/start/', '/faq/', '/repeaters/', '/settings/', '/hardware/', '/host-a-repeater/', '/help/', '/meshtastic/', '/contact/', '/contact/thanks/', '/contact/error/', '/about/'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const scheme of ['light', 'dark']) {
  for (const route of ROUTES) {
    test(`${route} in ${scheme}: no axe violations, no CSP errors`, async ({ page }) => {
      const cspErrors = [];
      page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) cspErrors.push(m.text()); });
      await page.emulateMedia({ colorScheme: scheme });
      await page.addInitScript((s) => { try { localStorage.setItem('starlight-theme', s); } catch { /* ignore */ } }, scheme);
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
      expect(cspErrors).toEqual([]);
    });
  }
}

for (const route of ROUTES) {
  test(`${route} at 320px has no horizontal scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('contact form keyboard order skips the honeypot', async ({ page }) => {
  await page.goto('/contact/');
  await page.locator('#mm-name').focus();
  const order = [];
  for (let i = 0; i < 5; i++) {
    order.push(await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName));
    await page.keyboard.press('Tab');
  }
  expect(order).toEqual(['mm-name', 'mm-email', 'mm-role', 'mm-message', 'BUTTON']);
});

test('search works under the CSP', async ({ page }) => {
  const cspErrors = [];
  page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) cspErrors.push(m.text()); });
  await page.goto('/');
  await page.getByRole('button', { name: /search/i }).first().click();
  await page.locator('.pagefind-ui__search-input').fill('repeater');
  await expect(page.locator('.pagefind-ui__result').first()).toBeVisible({ timeout: 10_000 });
  expect(cspErrors).toEqual([]);
});
