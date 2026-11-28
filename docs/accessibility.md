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
| 2026-11-25 | `/room/` | Screenshots in light and dark at 1100 px. The QR code sits on a white tile in both themes (huckleberry dots, river corners). It still decodes with zbarimg at 192, 300, and 600 px. The image has alt text. The public key wraps at 320 px. | Pass |
| 2026-11-26 | `/repeaters/` | Leaflet coverage map (Leaflet from unpkg, OpenStreetMap tiles), screenshots in light and dark at 1100 px, at the opening view and after panning far from town. Square outlines vs map land and streets: light (#f2efe9 / #ffffff) reached 8.0:1 / 8.9:1; dark tiles use a CSS filter (land #1c1915 measured) reached 7.1:1 (pinned by `tests/build/theme.test.js`). Repeater pins are filled circles with a contrasting ring: light #0d7268 (5.0:1 / 5.8:1), dark #f2b01e (9.2:1 / 10.2:1). Squares and pins differ by shape (square vs circle), so nothing depends on telling colors apart. Map takes Tab focus with a visible ring; arrow keys pan, + and − zoom; mouse wheel scrolls the page. The on-map OpenStreetMap credit uses the page colors. The text summary under the map is the text alternative; without JavaScript the map box is hidden. | Pass |
| 2026-11-27 | `/` | New home layout: blurb beside a compact coverage map, then the three join steps as cards. Screenshots at 1280 px (light), 1024 px (dark), 900 px, and 400 px: the blurb and map stack below 50rem, the cards wrap to one column on phones, no horizontal scroll. Tab order: skip link, site title, search, theme select, hero buttons, repeater list link, map, zoom in, zoom out, OpenStreetMap credit, join heading anchor, step links, full guide, contact link. Every stop showed a focus ring (Starlight default or the 3 px custom ring). axe (WCAG 2.2 AA) passes in light and dark. | Pass |

## Fixes made

- Coverage map: the dark-theme purple was too faint against dark map roads. Lightened to #bc96e4.
- Coverage map: Starlight's spacing between page elements pushed Leaflet's square layer 16 px down, so squares sat south of their streets. The map box now has `not-content`, and an e2e test checks the layers line up.

- Starlight's search button showed "Search Ctrl K" but was named "Search" (WCAG 2.5.3 Label in Name). The keyboard hint is hidden with CSS.
