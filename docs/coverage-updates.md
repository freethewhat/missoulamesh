# Updating the coverage map

The coverage map on `/repeaters/#coverage-map` draws the squares in `src/data/coverage.json`. Each square is one MeshMapper grid square (about 300 m) where a repeater replied.

## From a MeshMapper screenshot

1. Take a screenshot of the MeshMapper map after a drive.
   - Include some squares that are already on our map. The script uses them to line up the picture.
   - Use about the same zoom as before (a square about 15 to 20 px wide works well).
   - Hide menus if you can. If not, use `--crop` to leave them out.
2. Dry run. It changes nothing and writes a check picture next to the screenshot:
   ```
   node scripts/coverage-from-screenshot.js path/to/screenshot.png --crop 10,70,1900,948
   ```
   In the check picture: blue = already on our map, green = new, red = on the skip list.
3. Look at the check picture. If the green squares are right, run it again with `--write`:
   ```
   node scripts/coverage-from-screenshot.js path/to/screenshot.png --crop 10,70,1900,948 --write --as-of 2026-12-05
   ```
   This adds only new squares, keeps all old ones, and sets the "Last updated" date.
4. Update the summary sentence in `src/content/docs/repeaters.mdx` if the covered areas changed.
5. `npm run build && npm test`, then look at the page.

## What the script counts

- Reply squares: teal, green, and purple, on the light or dark map. Red and grey (no reply) are ignored.
- `scripts/coverage-skip.json` lists squares it never adds: old I-90 reports from before our 2026-11-26 drive. Add squares there to keep them off the map.
- To remove a square, delete its line from `src/data/coverage.json`.

## Limits

- It needs at least 5 squares that line up with the current map. With none (a whole new area), add a few squares by hand first, or ask for help lining it up.
- It reads colors, so map labels or road shields over a square can hide it. Check the picture.
