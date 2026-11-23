# Hardware, Host a Repeater, and Help Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/hardware/`, `/host-a-repeater/`, and `/help/` pages, plus app links on `/start/` and a "do not post" list in the FAQ.

**Architecture:** Starlight MDX pages in `src/content/docs/`. Device data lives in a new zod-validated `src/data/hardware.json`, loaded in `src/lib/data.js` and rendered by a new `HardwareList.astro` component (same pattern as `settings.json` + `ChannelTable.astro`). Tests are build-output tests on `dist/` HTML.

**Tech Stack:** Astro 7 + Starlight 0.43, zod 4, `node --test`, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-11-23-hardware-repeater-help-design.md`

## Global Constraints

- Tips only, no rules. The only "must" is the radio preset. Safety tips (admin password, privacy) are fine.
- Plain words. Short sentences. Explain any radio term right after it is used (matches existing pages).
- No affiliate links or tracking params (`?ref=`, `utm_`, `aff`, `sensecap_affiliate` etc.). Plain maker-store URLs.
- No embeds or third-party resources (`npm run build` runs `scripts/check-external.js`). Outside `<a href>` links are fine.
- WCAG 2.2 AA (`npm run test:e2e` runs axe on every route in `tests/e2e/a11y.spec.js`).
- Prices shown as "about $N (checked YYYY-MM-DD)" from `hardware.json`.
- Every new route is added to `ROUTES` in `tests/build/helpers.js` and in `tests/e2e/a11y.spec.js`.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A price or URL changes at the store: one edit to `hardware.json` must update the page; a stale `lastChecked` stays visible to the reader. (Task 1 test: page shows each device's `lastChecked` date.)
2. A store URL is copied with an affiliate tag. (Task 1 schema test rejects URLs with a query string.)
3. The Heltec V4 is tested and flips `triedHere`: it must move sections with no page edit. (Task 1 test: devices render in the section that matches `triedHere`.)
4. The radio preset changes in `settings.json`: the repeater page must follow it, not hard-code it. (Task 2 test: page text includes `settings.radio.presetName` read from the JSON.)
5. Repeater page drifts into rules ("must name", "required"). (Task 2 test: the word "must" appears only in the preset step.)

---

### Task 1: Hardware data and `/hardware/` page

**Files:**
- Create: `src/data/hardware.json`
- Modify: `src/lib/schemas.js` (add `hardwareSchema`)
- Modify: `src/lib/data.js` (export `hardware`)
- Create: `src/components/HardwareList.astro`
- Create: `src/content/docs/hardware.mdx`
- Modify: `astro.config.mjs` (sidebar)
- Modify: `tests/build/helpers.js`, `tests/e2e/a11y.spec.js` (ROUTES)
- Test: `tests/lib/schemas.test.js`, `tests/build/hardware-page.test.js`

**Interfaces:**
- Produces: `hardwareSchema` (zod array) in `src/lib/schemas.js`; `export const hardware` in `src/lib/data.js`; `<HardwareList role="companion" | "repeater" triedHere={boolean} />`.

Item shape:
```json
{ "id": "wio-tracker-l1-pro", "name": "Seeed Wio Tracker L1 Pro", "role": "companion",
  "url": "https://www.seeedstudio.com/Wio-Tracker-L1-Pro-for-Meshcore-p-6717.html",
  "priceUSD": 44, "facts": "Screen, GPS, built-in battery, and a case. Comes with MeshCore on it.",
  "triedHere": true, "lastChecked": "2026-11-23" }
```
Schema: `id` `/^[a-z0-9-]+$/`, `role` enum `companion|repeater`, `url` must be `https:` with no `?` or `#`, `priceUSD` positive number, `facts` non-empty, `triedHere` boolean, `lastChecked` reuses `isoDate`.

Entries: Wio Tracker L1 Pro (companion, $44, triedHere true); SenseCAP Solar Node P1-Pro (repeater, $93.90 → show 94, https://www.seeedstudio.com/SenseCAP-Solar-Node-P1-Pro-for-Meshcore-p-6741.html, "5 W solar panel, batteries, antenna, and GPS. Comes with MeshCore repeater firmware.", triedHere true); RAK WisMesh Tag, Seeed SenseCAP T1000-E, Heltec V4 (companion, triedHere false). Heltec V4 facts must say it is a bare board that needs a battery and a case.

- [ ] **Step 1: Verify the three unconfirmed devices.** Fetch the maker store pages for RAK WisMesh Tag (store.rakwireless.com), SenseCAP T1000-E (seeedstudio.com), Heltec V4 (heltec.org). Record clean URL and current USD price. If a page cannot be read, stop and report to the owner; do not guess a price.
- [ ] **Step 2: Write failing schema tests** in `tests/lib/schemas.test.js`: `hardwareSchema` accepts the real `src/data/hardware.json`; rejects a URL with `?ref=x`; rejects `role: "router"`; rejects `lastChecked: "2026-02-30"`.
- [ ] **Step 3: Run** `node --test tests/lib/schemas.test.js` → FAIL (`hardwareSchema` not exported).
- [ ] **Step 4: Implement** the schema, `hardware.json`, and the `hardware` export.
- [ ] **Step 5: Run** `node --test tests/lib/schemas.test.js` → PASS.
- [ ] **Step 6: Write failing build test** `tests/build/hardware-page.test.js`:
  - `<h1>` is "What to buy".
  - Section "Used in the valley" contains "Wio Tracker L1 Pro"; section "Other popular picks (not yet tried here)" contains "RAK WisMesh Tag", "T1000-E", "Heltec V4". Split the HTML at the second section's `<h2>` and assert each device lands on the side matching its `triedHere` in the JSON (loop over the JSON, do not hard-code).
  - For every companion in the JSON: an `<a href="{url}">` exists, and text includes `about $${Math.round(priceUSD)}` and `checked ${lastChecked}`.
  - Text includes "915 MHz", "antenna", "earn nothing".
  - Links `/host-a-repeater/`.
- [ ] **Step 7: Run** `npm run build && node --test tests/build/hardware-page.test.js` → FAIL (page missing).
- [ ] **Step 8: Implement** `HardwareList.astro` (a list or table of filtered `hardware`; each item: name as link, price line, facts) and `hardware.mdx` with sections from the spec: intro (explain **companion**), Used in the valley, Other popular picks (not yet tried here), For a repeater (one line + link to `/host-a-repeater/`), Tips. Sidebar "Get started": FAQ, Join the mesh, Hardware → `/hardware/`, Device settings, Repeaters. Add `/hardware/` to both ROUTES lists.
- [ ] **Step 9: Run** `npm run build && npm test` → all PASS.
- [ ] **Step 10: Commit** `feat: add hardware page with devices from hardware.json`.

### Task 2: `/host-a-repeater/` page

**Files:**
- Create: `src/content/docs/host-a-repeater.mdx`
- Modify: `astro.config.mjs`, `tests/build/helpers.js`, `tests/e2e/a11y.spec.js`
- Test: `tests/build/host-repeater-page.test.js`

**Interfaces:**
- Consumes: `settings` and `pathHashLabel` (existing); `hardware` from Task 1 (render the `role: "repeater"` items with `<HardwareList role="repeater" triedHere={true} />` for the Missoula example).

- [ ] **Step 1: Write failing test** `tests/build/host-repeater-page.test.js`:
  - `<h1>` is "Host a repeater (if you want)".
  - Text includes `settings.radio.presetName` and `pathHashLabel(settings.pathHashMode)` (read from JSON).
  - Links `/settings/` and `/contact/`.
  - Text includes "MSO_LNC_MM_001" and "SenseCAP Solar Node P1-Pro".
  - Text includes the default admin password as code: HTML matches `<code>password</code>`.
  - Text includes "street address", "rough", "defaults", "amplifier".
  - `(text.match(/\bmust\b/gi) || []).length === 1` and that sentence is about the preset.
  - No `set ` CLI commands in text (`assert.doesNotMatch(t, /\bset (name|lat|lon|freq|radio)\b/)`) — tips stay app-level.
- [ ] **Step 2: Run** `npm run build && node --test tests/build/host-repeater-page.test.js` → FAIL.
- [ ] **Step 3: Implement** the page with the spec's 5 sections, in this order: what it does + height; Missoula example; setup steps (preset = the one "must"; change admin password; name tip; rough location tip; leave advert settings at defaults; manage from the app after admin login); legal tip (no amplifier, US unlicensed limits); tell us (contact link). Sidebar "Community": Host a repeater → `/host-a-repeater/` first, then Contact, Meshtastic?, About. Add route to both ROUTES lists.
- [ ] **Step 4: Run** `npm run build && npm test` → PASS. The existing test "there is no repeater settings page or Run a repeater menu" must still pass unchanged.
- [ ] **Step 5: Commit** `feat: add host-a-repeater page`.

### Task 3: `/help/` page

**Files:**
- Create: `src/content/docs/help.mdx`
- Modify: `astro.config.mjs`, `tests/build/helpers.js`, `tests/e2e/a11y.spec.js`
- Test: `tests/build/help-page.test.js`

- [ ] **Step 1: Write failing test** `tests/build/help-page.test.js`:
  - `<h1>` is "When it does not work".
  - Has `<h2>` headings for each symptom, in order: "The app cannot find the radio", "The flasher cannot see the radio", "No reply on #missoula", "No repeaters in my list", "Start fresh", "Still stuck?".
  - Text includes "123456", "Chrome or Edge", "data", "Advert", "clock", "identity".
  - Links `/settings/`, `/repeaters/`, `/contact/`, and `https://docs.meshcore.io/faq/`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the page from the spec's symptom → fix list. Sidebar "Get started": add Help → `/help/` last. Add route to both ROUTES lists.
- [ ] **Step 4: Run** `npm run build && npm test` → PASS.
- [ ] **Step 5: Commit** `feat: add help page for common setup problems`.

### Task 4: Edits to `/start/` and `/faq/`

**Files:**
- Modify: `src/content/docs/start.mdx`, `src/content/docs/faq.mdx`
- Test: `tests/build/content-pages.test.js`

App URLs (from https://meshcore.io, 2026-11-23):
- Android: `https://play.google.com/store/apps/details?id=com.liamcottle.meshcore.android`
- iPhone: `https://apps.apple.com/us/app/meshcore/id6742354151` (meshcore.io lists the `/nz/` store; verify the `/us/` URL loads before using it, else keep the `/nz/` one)
- Web app: `https://app.meshcore.nz`

- [ ] **Step 1: Update tests** in `tests/build/content-pages.test.js`:
  - In "start has 7 steps in order": step 1 pattern becomes `/What you need[\s\S]*\/hardware\/[\s\S]*play\.google\.com[\s\S]*apps\.apple\.com[\s\S]*app\.meshcore\.nz/`; step 7 pattern becomes `/\/help\/[\s\S]*\/contact\//`.
  - New test "FAQ links to hardware": `/faq/` HTML matches `href="/hardware/"`.
  - New test "FAQ privacy lists what not to post": text includes "home address", "away from home", "passwords", "phone numbers".
- [ ] **Step 2: Run** `npm run build && node --test tests/build/content-pages.test.js` → FAIL on those tests.
- [ ] **Step 3: Implement.** Step 1 of `/start/`: link "MeshCore-compatible radio" to `/hardware/` and add the 3 app links labeled iPhone, Android, Web. Step 7: "See [When it does not work](/help/). Still stuck? Use the contact form…". FAQ "What do I need?": first bullet links to `/hardware/`. FAQ "Is it private?": add a short bulleted list after the public channels paragraph, written as advice, not rules.
- [ ] **Step 4: Run** `npm run build && npm test && npm run lint && npm run test:e2e` → all PASS.
- [ ] **Step 5: Commit** `feat: app links on join page, hardware and privacy tips in FAQ`.
