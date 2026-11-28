# Home page flow (design)

Date: 2026-11-27. Size: small change.

## Why

The home page should tell one story, with no "stop, start, stop":
what is mesh? It is here in Missoula. Here is where it reaches. Here is how to join.
The last two tries (steps beside intro, then steps beside map) felt disjointed.

## Approaches

- **A. One straight story.** One column, lead-in lines between parts, short full-width map, steps in a row.
- **B. Words and map together, then join (picked).** Blurb beside the map, then the steps in a full-width row.
  Picked by Matt in the mockup session: the blurb describes the picture next to it, then one clear action.
- **C. Map as backdrop.** Edge-to-edge map with the blurb on a card over it. Dropped: covers the map, harder to keep accessible.

## Design (B)

Below the hero, two rows:

1. **Blurb + map row.** Blurb on the left (narrower, about 1 : 1.3), map on the right.
   The blurb is vertically centered against the map.
   - Blurb: the two current paragraphs, then the "repeater list" link (moved here from the map caption).
   - Map: compact height (about 300 px), legend under it, then one small, muted line:
     "Last updated <date>. Coverage changes with weather, hills, and your antenna, so treat this as a rough guide."
   - No "Where the mesh reaches" heading on the home page. The blurb leads into the map instead.
     The map keeps its accessible name, so screen readers still find it.
2. **Join row.** "Join in three steps" heading, then the three steps as three cards in a row,
   each with its colored number. Same step text and links as now. Then "The full guide takes about 15 minutes."
   and "Already running MeshCore in the valley? Tell us."

Phone (narrow): blurb, map, then the three cards stacked.

## Constraints

- WCAG 2.2 AA in light and dark, visible focus, no horizontal scroll at 320 px (CLAUDE.md).
- No new third-party resources. The Repeaters page map stays full size.
- Home page build tests change to match the new order (blurb + map, then steps).

## Left to the builder

Exact spacing, card border and padding, and the breakpoint where the row stacks.
