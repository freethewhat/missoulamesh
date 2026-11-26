# Coverage Map (Leaflet) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static SVG coverage map on `/repeaters/` with a zoomable Leaflet map over a self-hosted Protomaps file.

**Architecture:** `coverage.json` (zod-checked) → `data-cells` attribute on a map element rendered by `CoverageMap.astro`. A bundled client script (`src/scripts/coverage-map-client.js`) starts Leaflet, adds a `protomaps-leaflet` layer reading `/maps/missoula.pmtiles` (range requests to our own server), and draws squares from `cellBounds`. Revision 1's SVG pieces are removed.

**Tech Stack:** Astro 7, Leaflet 1.9.4, protomaps-leaflet 5.1.0, zod 4, node:test, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-11-26-coverage-map-design.md` (revision 2)

## Global Constraints

- No request to another origin. `server/csp.js` and `scripts/check-external.js` unchanged.
- Pinned versions: `leaflet` `1.9.4`, `protomaps-leaflet` `5.1.0` (exact, like the rest of `package.json`).
- Map file: `public/maps/missoula.pmtiles`, bbox `-114.12,46.80,-113.78,46.95`, maxzoom 15, from build `20261126`.
- Zoom 11 to 17; pan limited to the bbox; `scrollWheelZoom: false`; map height `min(60vh, 480px)`.
- `reached`: filled, semi-transparent, solid outline. `no-reply`: no fill, dashed outline. ≥3:1 against the map in both themes.
- Credits: MeshMapper (`https://meshmapper.net/`), © OpenStreetMap contributors (`https://www.openstreetmap.org/copyright`), Protomaps (`https://protomaps.com`).
- No repeater markers. WCAG 2.2 AA light and dark. No horizontal scroll at 320 px.
- Commit only when Matt says so.

## Review Focus

1. Theme switch while on the page must restyle the map (light ↔ dark). → e2e test in Task 3.
2. Mouse wheel over the map must scroll the page, not zoom. → `scrollWheelZoom: false`, e2e asserts the option via zoom level unchanged after a wheel event, Task 3.
3. A range request for the map file must return 206 through the real Express app (Caddy and browsers rely on it). → server test, Task 2.
4. Leaflet's own controls (zoom, attribution) must pass axe contrast in dark theme. → covered by existing axe dark run once the map is on the page; style overrides in Task 3.
5. JavaScript failing must leave the summary and credits readable. → they are server-rendered HTML; build test in Task 3.

---

### Task 1: Remove the SVG map pieces, add Leaflet helpers

**Files:** Delete `scripts/basemap.js`, `src/data/basemap.json`. Modify `src/lib/schemas.js`, `src/lib/data.js`, `src/lib/coverage-map.js`, `tests/lib/schemas.test.js`, `tests/lib/coverage-map.test.js`, `CLAUDE.md`.

**Interfaces:** Produces in `src/lib/coverage-map.js`: `GRID`, `snapCell(lat, lon)`, `uniqueCells(cells) → cells[]` (snapped, deduped, reached wins, input order kept), `cellBounds({lat, lon}) → [[south, west], [north, east]]`.

- [ ] Replace the projection tests with: `uniqueCells` dedupes and "reached wins"; `uniqueCells([])` is `[]`; `cellBounds({ lat: 46.8531, lon: -113.9904 })` deep-equals `[[46.8531, -113.9904], [46.8558, -113.98656]]`. Keep the `snapCell` tests. Remove basemap schema tests.
- [ ] Run `node --test tests/lib/coverage-map.test.js` → FAIL.
- [ ] Implement; remove `makeProjection`, `cellRects`, `linePath`, `labelPoints`, `basemapSchema`, `basemap` export, the basemap `CLAUDE.md` line.
- [ ] Run `node --test tests/lib` → PASS.

### Task 2: Dependencies, map file, range requests

**Files:** `package.json`, `package-lock.json`, create `public/maps/missoula.pmtiles`, `tests/server/maps.test.js`, `CLAUDE.md`.

- [ ] Write `tests/server/maps.test.js`: with `createApp` over a temp dist dir holding a 1 KB `maps/test.pmtiles`, `GET /maps/test.pmtiles` with `Range: bytes=0-99` → status 206, body length 100, `Content-Range: bytes 0-99/1024`. Run → FAIL only if range is unsupported (if it passes first time, record it: it pins existing behavior).
- [ ] `npm install --save-exact leaflet@1.9.4 protomaps-leaflet@5.1.0`.
- [ ] Copy the extract made on 2026-11-26 into `public/maps/missoula.pmtiles`.
- [ ] `CLAUDE.md` Commands: `` `~/go/bin/go-pmtiles extract https://build.protomaps.com/<YYYYMMDD>.pmtiles public/maps/missoula.pmtiles --bbox=-114.12,46.80,-113.78,46.95 --maxzoom=15`: rebuild the street map for the coverage map (install once with `go install github.com/protomaps/go-pmtiles@latest`). ``
- [ ] `npm test` → PASS.

### Task 3: Leaflet component, colors, page, tests

**Files:** Rewrite `src/components/CoverageMap.astro`; create `src/scripts/coverage-map-client.js`; modify `src/styles/theme.css`, `tests/build/repeaters-page.test.js`, `tests/build/theme.test.js`, `tests/e2e/a11y.spec.js` (or a new `tests/e2e/coverage-map.spec.js`), `docs/accessibility.md`.

- [ ] Build tests: map element `<div class="mm-coverage-map" ... data-cells=...>` before `mm-repeaters`; `data-cells` parses to 77 entries; legend, date, summary, all three credits; `dist/maps/missoula.pmtiles` exists; no `<circle>`; contrast test for `--mm-map-bg`, `--mm-cov-reached`, `--mm-cov-none` in both themes (drop river/road/label vars). Run → FAIL.
- [ ] Theme vars: keep `--mm-map-bg` (map container background while tiles load), `--mm-cov-reached`, `--mm-cov-none`; remove the river/road/label vars.
- [ ] Component: server-rendered map div (`role="region"`, `aria-label="Coverage map. Summary below."`, `tabindex` left to Leaflet), legend, summary (slot), credits. `<script>` imports `../scripts/coverage-map-client.js` (Astro bundles it).
- [ ] Client: `L.map(el, { minZoom: 11, maxZoom: 17, maxBounds, maxBoundsViscosity: 1, scrollWheelZoom: false })`; `leafletLayer({ url: '/maps/missoula.pmtiles', flavor, lang: 'en', maxDataZoom: 15 })`; `flavor` = `'dark'` when `document.documentElement.dataset.theme === 'dark'` else `'light'`; a `MutationObserver` on `data-theme` swaps the layer and re-reads square colors from CSS vars; squares via `L.rectangle(cellBounds(c), style)`; `fitBounds` over the squares. Import `leaflet/dist/leaflet.css`.
- [ ] `npm run build && npm test` → PASS.
- [ ] E2E (`tests/e2e/coverage-map.spec.js`): map container has `.leaflet-container`; at least one tile canvas; 77 `path.leaflet-interactive`; no request to another origin (record `page.on('request')`); toggling theme to dark changes the flavor (`data-flavor` attribute the client sets on the map element); wheel over map leaves zoom unchanged; map is focusable. `npm run test:e2e` → PASS.
- [ ] Screenshots at 320 px and 1100 px, light and dark, zoomed to Broadway & Russell (46.8706, -114.0185, zoom 16): street names readable, squares visible.
- [ ] Log in `docs/accessibility.md`. `npx eslint .` clean.

### Wrap-up

- [ ] Leave the server running on port 3200 for Matt. Report what is running. Ask before any commit or push.
