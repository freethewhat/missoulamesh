import { test, expect } from '@playwright/test';

test('a first visit is light, even when the system is dark, and stores nothing', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('starlight-theme'))).toBeNull();
});

for (const [choice, system, expected] of [['dark', 'light', 'dark'], ['auto', 'dark', 'dark'], ['light', 'dark', 'light']]) {
  test(`choosing ${choice} persists across pages (system ${system})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: system });
    await page.goto('/');
    await page.locator('starlight-theme-select select').first().selectOption(choice);
    await expect(page.locator('html')).toHaveAttribute('data-theme', expected);
    await page.goto('/about/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', expected);
    await expect(page.locator('starlight-theme-select select').first()).toHaveValue(choice);
  });
}
