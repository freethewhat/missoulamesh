# Coverage map on the Repeaters page

Date: 2026-11-26. Status: revision 3, built.

> **Revision 3 (Matt's decision, 2026-11-26):** the self-hosted map file was dropped. Leaflet 1.9.4 now loads from unpkg (pinned, SRI) and the street map is OpenStreetMap's tiles (`tile.openstreetmap.org`). This is a deliberate, documented exception to the no-third-party rule: both hosts are in `server/csp.js`, the two Leaflet files are the only `ALLOWED_RESOURCES` in `scripts/check-external.js`, and `CLAUDE.md` says so. Squares, colors, legend, summary, wheel and keyboard behavior are unchanged. Dark theme darkens the tiles with a CSS filter. The rest of this document describes revision 2; where it says "self-hosted", "pmtiles", or "Protomaps", read OpenStreetMap tiles instead.

## Why

Matt drove around Missoula with the MeshMapper app on 2026-11-26. The data shows where a phone could reach a repeater. A map of that helps people answer "Can I reach the mesh from here?" and shows where a new repeater would help most.

Revision 1 drew a fixed SVG map. Matt tried it and found it does not answer the real question: "I'm at Broadway and Russell. Is there coverage?" You need to zoom to street level and see street names. So revision 2 uses a zoomable map.

## What was ruled out, and why

| Approach | Why not |
|---|---|
| Embed the MeshMapper map (iframe) | Needs a MeshMapper region. Missoula has none, and a region needs an MQTT observer the local group does not want. |
| MeshMapper Coverage API | Needs a region key. Same blocker. |
| Static SVG (revision 1) | Built and tested, but you cannot zoom to a street corner. |
| Leaflet + OpenStreetMap's tile servers | Breaks the project's no-third-party rule: CSP exception, and every visitor's browser contacts OpenStreetMap. OSM can also rate-limit or block. |
| **Leaflet + our own map file (picked)** | Street-level zoom with street names. Everything is served from our own server. CSP unchanged. |

## Goals

- A zoomable street map of the Missoula valley on `/repeaters/`, under the intro and above the repeater list, with the coverage squares on top.
- You can zoom in far enough to read street names (Broadway, Russell) and see which squares cover a corner.
- Nothing loads from another origin. `server/csp.js` and `scripts/check-external.js` stay as they are.
- WCAG 2.2 AA in light and dark, no horizontal scroll at 320 px.
- Updating coverage is still a JSON edit to `src/data/coverage.json`.

## Non-goals

- No "find my location" button (needs a permission prompt and a Permissions-Policy change; can come later).
- No repeater markers. The page shows areas, not exact locations.
- No map outside the valley frame.
- No new page.

## Anti-goals

- Any request to another origin: tiles, fonts, scripts, sprites.
- A map that traps the page: scrolling the page with a mouse wheel or a finger must still work.
- Meaning by color alone.

## Constraints

- Map data is OpenStreetMap (ODbL) via Protomaps. Show "© OpenStreetMap contributors" and "Protomaps" with links.
- Coverage data from MeshMapper has no license. Credit MeshMapper with a link. Matt asks the MeshMapper team before the PR merges.
- Site copy: short, plain, suggestions, not rules.

## Design

### Libraries (new npm dependencies)

- `leaflet` 1.9.4 (BSD-2): the map, zoom buttons, keyboard panning.
- `protomaps-leaflet` 5.1.0 (BSD-3): draws vector map tiles from a `.pmtiles` file onto canvas inside Leaflet. Light and dark map styles built in.
- Checked: neither uses `eval`, `new Function`, web workers, or `blob:` URLs, and neither loads remote fonts. Labels use the page's own fonts on canvas.
- Astro bundles them into `/_astro/*.js` and `/_astro/*.css`. No CDN.

### Map file

- `public/maps/missoula.pmtiles`: one file holding the valley's streets, rivers, parks, and labels, zoom 0 to 15. Served by Express like any static file. Express already supports HTTP range requests, so the browser fetches only the parts it needs for the current view (a few hundred KB, not the whole file).
- Made once, by hand, with the `go-pmtiles` command-line tool (installed in `~/go/bin/` on 2026-11-26 with `go install github.com/protomaps/go-pmtiles@latest`), from the Protomaps daily world build:
  `~/go/bin/go-pmtiles extract https://build.protomaps.com/<YYYYMMDD>.pmtiles public/maps/missoula.pmtiles --bbox=-114.12,46.80,-113.78,46.95 --maxzoom=15`
- Tried on 2026-11-26 with build `20261126`: 937 tiles, 5.1 MB, done in about 2 seconds. The file is committed. The build never goes online.
- The command goes in `CLAUDE.md` under Commands.

### Coverage squares

- Read from `src/data/coverage.json` at build time (existing zod schema). Passed to the browser in a `data-cells` attribute on the map element, not an inline script.
- Pure helpers in `src/lib/coverage-map.js` (unit tested): `GRID`, `snapCell`, `uniqueCells` (dedupe, "reached" wins), `cellBounds(cell) → [[south, west], [north, east]]`.
- Drawn as Leaflet rectangles:
  - `reached`: filled, semi-transparent (streets show through), solid outline.
  - `no-reply`: no fill, dashed outline. Shape and line style differ, not only color.
- Colors come from theme variables, light and dark, at least 3:1 against the map.

### Map behavior

- Opens fitted to the coverage squares. You can zoom from about 11 (whole valley) to 17 (street level; tiles above 15 are scaled up).
- Panning is limited to the frame.
- Mouse-wheel zoom is off, so the wheel scrolls the page. Zoom with the + and − buttons, pinch, or double-tap. One-finger drag pans the map. The map is at most 60% of the screen height, so there is always page to scroll past it.
- Light and dark map styles follow the site theme, including when you switch themes while on the page.
- Keyboard: the map takes focus with Tab, arrow keys pan, + and − zoom. Visible focus ring on the map and the zoom buttons.

### On the page

```
## Where people have reached the mesh

[ zoomable map, ~60% screen height ]
Legend:  ■ Reached a repeater   ┅ No reply

Tested by driving around on Nov 26, 2026. Coverage changes with weather,
hills, and your antenna, so treat this as a rough guide. Most of the
south side, around the Lewis and Clark and Franklin to the Fort
neighborhoods, reached a repeater. So did parts of Orchard Homes. Other
areas have not been tested yet.

Coverage data: MeshMapper. Map data © OpenStreetMap contributors, Protomaps.
```

- The text summary stays: it is the text alternative for the map, and what people without JavaScript see. The map element has an accessible name that points to the summary.

### What goes away from revision 1

- The static SVG, `src/data/basemap.json`, `scripts/basemap.js`, its schema, its `CLAUDE.md` line, and their tests. `coverage.json`, its schema, `GRID`, `snapCell`, and the "reached wins" rule stay.

### Tests

- Unit: `cellBounds`, `uniqueCells` ("reached" wins, duplicates once), existing `snapCell` tests.
- Build: the map element is on `/repeaters/` before the list; `data-cells` holds every unique square; legend, date, summary, and all credits present; `missoula.pmtiles` is in `dist/maps/`; no `<circle>` or repeater markers; contrast test for the new theme variables in both themes.
- E2E: on `/repeaters/`, the map draws (Leaflet container and at least one tile canvas), the squares draw (one path per square), no CSP console errors, no request to another origin, axe passes in light and dark, the map is keyboard-focusable, and no horizontal scroll at 320 px.
- Server: a range request for `/maps/missoula.pmtiles` returns 206.
- Log the manual checks in `docs/accessibility.md`.

## Calls made by Claude (please check)

1. **Drop the SVG map** rather than keep it as a no-JavaScript fallback. Two maps means two things to keep right. Without JavaScript you still get the text summary.
2. **Commit the map file** (5.1 MB) rather than download it during the Docker build, so builds never depend on a network.
3. **Mouse-wheel zoom off**, so the map never traps page scrolling.
4. **Zoom 15 tiles, shown up to 17.** Plenty for street names; keeps the file small.

## Left to the builder

- Exact fill opacity and dash pattern, as long as contrast passes in both themes.
- Styling Leaflet's zoom buttons and attribution so they match the site and pass contrast.
