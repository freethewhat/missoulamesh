# Accessibility checks

Target: WCAG 2.2 AA, light and dark.

## Automated (every CI run)

`npm run test:e2e` (`tests/e2e/a11y.spec.js`):
- axe (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) on every Release 1 page, light and dark.
- No Content Security Policy errors in the console.
- No horizontal scroll at 320 px width.
- Contact form keyboard order: name, email, role, message, send. The honeypot is skipped.
- Site search works under the CSP.

## Manual passes

| Date | Pages | What was checked | Result |
|---|---|---|---|
| 2026-11-22 | `/`, `/start/` | Tab through every focusable element in light theme. Order: skip link, site title, search, theme select, (sidebar on `/start/`), page content links. Every element showed a visible focus ring (Starlight default or the 3 px custom ring on home buttons and form controls). | Pass |

## Fixes made

- Starlight's search button showed "Search Ctrl K" but was named "Search" (WCAG 2.5.3 Label in Name). The keyboard hint is hidden with CSS.
