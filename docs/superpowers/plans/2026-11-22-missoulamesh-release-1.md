# Missoula Mesh Release 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship Release 1 of missoulamesh.org: an Astro + Starlight site (Home, Start, Repeaters, Settings, Meshtastic, Contact, About) served by one small Node server with a Resend-backed contact form, deployed to the owner's VPS with the same pipeline as hamlicenselookup.

**Architecture:** Astro + Starlight builds static pages into `dist/`. Every setting and repeater value comes from `src/data/settings.json` and `src/data/repeaters.json`, checked by zod schemas. One Express 5 server (`server/`) serves `dist/`, handles `POST /api/contact` (Resend HTTPS API), `GET /api/health`, and sets all security headers including the CSP. A Docker image goes to GHCR. GitHub Actions deploys over SSH to `/srv/apps/missoulamesh` behind the existing Caddy.

**Tech Stack:** Node 22+ (image `node:24-bookworm-slim`), Astro 7.4.x, @astrojs/starlight 0.43.x, starlight-links-validator, zod, Express 5, express-rate-limit, node:test, Playwright + @axe-core/playwright, ESLint, Docker, GitHub Actions, Caddy (existing).

**Spec:** `docs/superpowers/specs/2026-11-22-missoulamesh-site-design.md`

## Global Constraints

- Domain `missoulamesh.org`. Addresses: `hello@missoulamesh.org` (public, forwarded by Namecheap), `contact@missoulamesh.org` (form sender).
- Site title "Missoula Mesh". Tagline "Western Montana MeshCore". Hero line: "Off-grid text messages, built by neighbors in the Missoula Valley."
- No third-party requests from any page: no CDNs, no Google Fonts, no embeds. Outside links (`<a href>`) are fine.
- WCAG 2.2 AA on every page, light and dark.
- Plain words, short steps. Explain any radio term right after it is used.
- No value from `settings.json` or `repeaters.json` is typed into a page by hand.
- Repeaters are shown by neighborhood name only. Never an address or pin.
- Launch repeater list: one entry, area "Lewis and Clark neighborhood", status `testing`. Do not list the other operator's repeater.
- `settings.json` has `tested: false` at launch. While false, every page that shows settings shows the "not yet tested locally" note.
- Radio: preset "USA/Canada (Recommended)", 910.525 MHz, BW 62.5 kHz, SF 7, CR 5, CLI `set radio 910.525,62.5,7,5`. Path hash mode 1 (2-byte). Regions `us-mt`, `us-mt-mso` (parent `us-mt`). Channels: Public, `#missoula`, `#montana`, `#testing`, `#emergency`.
- Colors (start points; adjust shades only to pass AA): light paper `#f4efe3`, ink `#2b2a24`, forest `#24452f`, rust `#b5562a`, line `#d8cfb8`; dark background `#1b2a20`, text `#f4efe3`, sage `#7fa98a`, light rust `#e58a5c`. Serif headings (Georgia stack), system sans body. System font stacks only.
- App name `missoulamesh`, container `missoulamesh`, internal port `3200`, `mem_limit: 128m`, on the external `web` network.
- Secrets (`RESEND_API_KEY`, `CONTACT_TO`) live only in `/srv/apps/missoulamesh/contact.env` (mode 600). Never in the repo or image.
- No code change in `/home/matt/repos/hamlicenselookup`.
- Pin every npm dependency to an exact version in `package.json`.
- Security headers are set by the Node server, not Caddy, so tests can check them. Caddy only proxies and redirects `www`. *(Plan call; the spec put headers in Caddy.)*
- Commit messages end with: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Review Focus

1. **Contact form with JavaScript off.** The `ts` field is then empty. The message must still send (skip the time check, keep the other spam checks). Test in Task 6.
2. **Header injection and junk in form fields.** A name with CR/LF, an email with spaces or no `@`, a 6000-character message, or a `role` not in the list must be rejected with a redirect to `/contact/error/`. Nothing reaches Resend. Test in Task 6.
3. **Mail not configured or Resend down.** If `RESEND_API_KEY` is missing or Resend returns non-2xx or the fetch throws, the site still serves pages, `/api/health` is 200, and the visitor gets `/contact/error/`, which shows `hello@missoulamesh.org`. Test in Task 6.
4. **Rate limit behind Caddy.** With `trust proxy` set to 1, the limit keys on `X-Forwarded-For`, so two visitors through Caddy do not share one limit. Test in Task 6.
5. **Bad or odd repeater dates.** `lastChecked` that is not a real `YYYY-MM-DD` fails the build. A date in the future counts as fresh, not stale. Test in Task 2.

---

## File Structure

```
astro.config.mjs                 Starlight config: title, logo, sidebar, customCss, links validator, site URL
package.json                     scripts: dev, build, test, test:e2e, lint, start
eslint.config.js
.gitignore                       node_modules, dist, .env, contact.env, .superpowers/, test-results, playwright-report
src/
  content.config.ts              Starlight docs collection
  data/settings.json             radio, path hash, regions, channels, tested flag, lastReviewed, fccNote
  data/repeaters.json            repeater list
  lib/schemas.js                 zod schemas: settingsSchema, repeatersSchema
  lib/channels.js                channelKey(name)
  lib/radio.js                   radioCli(radio)
  lib/status.js                  effectiveStatus(entry, today, maxAgeDays)
  scripts/stale-status.js        browser: marks stale repeater rows
  styles/theme.css               trail-map colors, topo, ridge, tags, note box, step list
  assets/badge-light.svg, badge-dark.svg
  components/
    UntestedNote.astro           shows note when settings.tested is false
    RadioSettings.astro          radio table + CLI block
    ChannelTable.astro           channel name, type, key for hashtag channels
    RegionList.astro             regions
    RepeaterList.astro           list with status tag + last checked (+ compact prop for home)
    HomeHero.astro               splash hero, 2 buttons, ridge band
    ContactForm.astro            the form
  content/docs/
    index.mdx                    Home (template: splash)
    start.mdx  repeaters.mdx  settings.mdx  meshtastic.mdx  about.mdx
    contact.mdx  contact/thanks.mdx  contact/error.mdx
public/favicon.svg
server/
  index.js                       reads env, builds mailer + csp, listens
  app.js                         createApp(options)
  contact.js                     parseContact(body, nowMs)
  mailer.js                      createResendSender(options)
  csp.js                         buildCsp(scriptHashes), collectInlineScriptHashes(distDir)
scripts/
  csp-hashes.js                  post-build: writes dist/csp-hashes.json
  check-external.js              post-build: fails on third-party resource URLs
tests/
  lib/*.test.js                  node:test unit tests
  build/*.test.js                node:test on built dist/ HTML
  server/*.test.js               node:test on the Express app
  e2e/a11y.spec.js               Playwright + axe
playwright.config.js
Dockerfile  .dockerignore
deploy/
  missoulamesh/docker-compose.yml   template with __IMAGE__
  missoulamesh/deploy.sh
  missoulamesh.caddy                template with __DOMAIN__
  setup-app.sh
  README.md
.github/workflows/ci-deploy.yml
```

---

### Task 1: Repo and Astro + Starlight scaffold

**Files:**
- Create: `package.json`, `astro.config.mjs`, `src/content.config.ts`, `src/content/docs/*.mdx` (placeholders for the 7 Release 1 pages plus `contact/thanks.mdx`, `contact/error.mdx`), `.gitignore`, `eslint.config.js`, `tests/build/pages.test.js`
- Already present: `docs/superpowers/**`

**Interfaces:**
- Produces: `npm run build` writes `dist/` with one `index.html` per route: `/`, `/start/`, `/repeaters/`, `/settings/`, `/meshtastic/`, `/contact/`, `/contact/thanks/`, `/contact/error/`, `/about/`. Test helper `readPage(route) -> string` in `tests/build/helpers.js` reads `dist/<route>/index.html`.

- [ ] **Step 1:** `git init -b main` in `/home/matt/repos/missoulamesh`. Write `.gitignore` (list in File Structure).
- [ ] **Step 2:** Create the project: `npm create astro@latest -- --template starlight --no-install --no-git .` (or add `astro`, `@astrojs/starlight`, `starlight-links-validator` by hand), then `npm install` and pin exact versions. Add `zod`, `express`, `express-rate-limit` to dependencies; `eslint`, `@eslint/js`, `globals`, `@playwright/test`, `@axe-core/playwright` to devDependencies. `"type": "module"`, `"engines": {"node": ">=22"}`.
- [ ] **Step 3:** Scripts: `"build": "astro build && node scripts/csp-hashes.js && node scripts/check-external.js"` (the two scripts are added in Tasks 7 and 8; until then use `astro build` only), `"test": "node --test tests/lib tests/build tests/server"`, `"test:e2e": "playwright test"`, `"lint": "eslint ."`, `"start": "node server/index.js"`.
- [ ] **Step 4:** `astro.config.mjs`: `site: 'https://missoulamesh.org'`, `build: { inlineStylesheets: 'never' }`, Starlight `title: 'Missoula Mesh'`, `plugins: [starlightLinksValidator()]`, sidebar:
  - "Get started": I just got a device `/start/`, Repeaters `/repeaters/`, Local settings `/settings/`
  - "Community": Contact `/contact/`, Meshtastic? `/meshtastic/`, About `/about/`
  `contact/thanks` and `contact/error` are not in the sidebar.
- [ ] **Step 5: Write the failing test** `tests/build/pages.test.js`: for each of the 9 routes, `readPage(route)` exists and contains `<title>` with "Missoula Mesh".
- [ ] **Step 6:** Run `npm run build && npm test`. Expected: FAIL until all placeholder pages exist; then add them (title + one line each).
- [ ] **Step 7:** Run `npm run build && npm test && npm run lint`. Expected: PASS.
- [ ] **Step 8: Commit** `chore: scaffold Astro Starlight site` (include `docs/`).

---

### Task 2: Data files, schemas, and pure helpers

**Files:**
- Create: `src/data/settings.json`, `src/data/repeaters.json`, `src/lib/schemas.js`, `src/lib/channels.js`, `src/lib/radio.js`, `src/lib/status.js`
- Test: `tests/lib/schemas.test.js`, `tests/lib/channels.test.js`, `tests/lib/radio.test.js`, `tests/lib/status.test.js`

**Interfaces:**
- Produces:
  - `settingsSchema`, `repeatersSchema` (zod) from `src/lib/schemas.js`
  - `channelKey(name: string) -> string` (32 lowercase hex)
  - `radioCli(radio: {frequencyMHz, bandwidthKHz, spreadingFactor, codingRate}) -> string`
  - `effectiveStatus(entry: {status, lastChecked}, today: Date, maxAgeDays = 30) -> {status: string, stale: boolean}`
  - `settings.json` shape:
    ```json
    {
      "tested": false,
      "lastReviewed": "2026-11-22",
      "radio": { "presetName": "USA/Canada (Recommended)", "frequencyMHz": 910.525, "bandwidthKHz": 62.5, "spreadingFactor": 7, "codingRate": 5 },
      "pathHashMode": 1,
      "regions": [ { "name": "us-mt", "parent": null }, { "name": "us-mt-mso", "parent": "us-mt" } ],
      "channels": [
        { "name": "Public", "type": "public" },
        { "name": "#missoula", "type": "hashtag" },
        { "name": "#montana", "type": "hashtag" },
        { "name": "#testing", "type": "hashtag" },
        { "name": "#emergency", "type": "hashtag" }
      ],
      "fccNote": "MeshCore GitHub issue #945 asks whether the US 62.5 kHz preset meets FCC rule 15.247. There is no FCC action yet. If the preset changes, this page changes with it."
    }
    ```
  - `repeaters.json`: array of `{ id, name: string|null, area, status: "testing"|"on-air"|"down"|"unknown", lastChecked: "YYYY-MM-DD", contact: string|null, notes: string|null }`. Launch content: one entry `{ "id": "lewis-and-clark-1", "name": null, "area": "Lewis and Clark neighborhood", "status": "testing", "lastChecked": "2026-11-22", "contact": null, "notes": "First Missoula Mesh repeater. Being tested this week." }`.

- [ ] **Step 1: Write failing tests**
  - `channelKey('#denver') === 'b24355a0d22ed2bf393ec530d75810b4'`; `channelKey('#testing') === 'cde5e82cf515647dcb547a79a4f065d1'` (published by Denver MeshCore; key = first 16 bytes of SHA-256 of the name including `#`).
  - `radioCli(settings.radio) === 'set radio 910.525,62.5,7,5'`.
  - `effectiveStatus({status:'on-air', lastChecked:'2026-11-01'}, new Date('2026-11-22'))` → `{status:'on-air', stale:false}`; with today `2026-12-15` → `{status:'unknown', stale:true}`; `lastChecked:'2027-01-01'` with today `2026-11-22` → not stale.
  - `settingsSchema.parse(settings)` and `repeatersSchema.parse(repeaters)` pass on the real files.
  - Schema rejects: region name `US-MT` (uppercase), region name over 29 bytes, `lastChecked: '2026-13-40'`, `status: 'up'`, missing `area`, `codingRate: 9` (allowed 5–8), `spreadingFactor: 13` (allowed 5–12).
- [ ] **Step 2:** Run `node --test tests/lib`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement. `channelKey` uses `node:crypto` (build time only). `lastChecked` must be a real calendar date (`YYYY-MM-DD` that round-trips through `Date`). Region names: `/^[a-z0-9-]+$/`, ≤29 bytes UTF-8.
- [ ] **Step 4:** Run `node --test tests/lib`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add settings and repeater data with schemas`

---

### Task 3: Trail-map theme and trail badge

**Files:**
- Create: `src/styles/theme.css`, `src/assets/badge-light.svg`, `src/assets/badge-dark.svg`, `public/favicon.svg`
- Modify: `astro.config.mjs` (`logo: { light, dark, alt: '' , replacesTitle: false }`, `customCss: ['./src/styles/theme.css']`, `favicon: '/favicon.svg'`)
- Test: `tests/build/theme.test.js`

**Interfaces:**
- Produces CSS classes used by later components: `.mm-note` (rust left-border note box), `.mm-tag` + `.mm-tag--testing|--on-air|--down|--unknown`, `.mm-steps` (big numbered steps), `.mm-ridge` (ridge band), `.mm-hero`, `.mm-buttons`.

- [ ] **Step 1: Write the failing test:** built `/` HTML references the badge logo image (`<img` with `badge-light`), `dist/favicon.svg` exists, and a built CSS file in `dist/_astro/` contains `#f4efe3` (or the adjusted paper shade).
- [ ] **Step 2:** Run `npm run build && node --test tests/build/theme.test.js`. Expected: FAIL.
- [ ] **Step 3:** Map the Global Constraints colors to Starlight variables (`--sl-color-accent*`, `--sl-color-white/black/gray-*`, `--sl-color-bg`, `--sl-color-text`) for `:root[data-theme='light']` and `:root` (dark). Headings `font-family: Georgia, 'Times New Roman', serif`; body uses `system-ui` stack. Topo lines: a faint `repeating-radial-gradient` on the splash hero only. Ridge: `clip-path` polygon band in forest (sage in dark). Badge SVG: circle, peak, two signal arcs, one dot (from the `logo.html` mockup option 3: light = forest circle + paper peak + light-rust arcs; dark = sage circle + dark peak). Favicon = light badge.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5:** Look at `/` and `/start/` with `npm run dev` in light and dark (Playwright screenshot or a browser). Check the rust text contrast: if rust on paper is under 4.5:1, darken the text-use rust (keep `#b5562a` for fills where white text sits on it and passes).
- [ ] **Step 6: Commit** `feat: trail-map theme and badge`

---

### Task 4: Data-driven components, Repeaters and Settings pages

**Files:**
- Create: `src/components/UntestedNote.astro`, `RadioSettings.astro`, `ChannelTable.astro`, `RegionList.astro`, `RepeaterList.astro`, `src/scripts/stale-status.js`
- Modify: `src/content/docs/repeaters.mdx`, `src/content/docs/settings.mdx`
- Test: `tests/build/settings-page.test.js`, `tests/build/repeaters-page.test.js`

**Interfaces:**
- Consumes: data files and helpers from Task 2; CSS classes from Task 3.
- Produces: `<UntestedNote />` (no props; reads `settings.tested`), `<RadioSettings />`, `<ChannelTable />`, `<RegionList />`, `<RepeaterList compact?: boolean />`. Each repeater row has `data-last-checked="YYYY-MM-DD"` and `data-status="<status>"`; `stale-status.js` uses `effectiveStatus` with today's date and, when stale, replaces the tag text with "Status unknown" and keeps the visible "Last checked <date>".

- [ ] **Step 1: Write failing tests** on built HTML:
  - `/settings/` contains `910.525`, `62.5`, `set radio 910.525,62.5,7,5`, `USA/Canada (Recommended)`, `us-mt-mso`, `#missoula`, and `channelKey('#missoula')` (computed in the test).
  - `/settings/` contains the `.mm-note` text "not yet tested locally" (because `tested` is false).
  - `/repeaters/` contains "Lewis and Clark neighborhood", a `.mm-tag--testing`, "Last checked", `2026-11-22`, and `data-last-checked="2026-11-22"`.
  - `/repeaters/` page text says the list shows areas, not exact locations, and links to `/contact/` with "Run a MeshCore repeater in the valley?".
- [ ] **Step 2:** Run `npm run build && node --test tests/build`. Expected: FAIL.
- [ ] **Step 3:** Implement the components and pages. The Settings page sections: Radio (with what each value means in plain words), Companion settings (preset, path hash size 2-byte, leave default region scope blank), Channels (keys for devices that cannot type `#`), Regions (define on repeaters, no default scope yet), and the FCC note from `settings.fccNote`. Code blocks use Starlight's built-in copy button.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat: settings and repeaters pages from data`

---

### Task 5: Home, Start, Meshtastic, and About pages

**Files:**
- Create: `src/components/HomeHero.astro`
- Modify: `src/content/docs/index.mdx` (`template: splash`), `start.mdx`, `meshtastic.mdx`, `about.mdx`
- Test: `tests/build/content-pages.test.js`

**Interfaces:**
- Consumes: `RepeaterList` (compact), `UntestedNote`, `RadioSettings` from Task 4.

- [ ] **Step 1: Write failing tests** on built HTML:
  - `/`: hero line exact; link "I just got a device" → `/start/`; link "I already use MeshCore" → `/contact/`; the compact repeater list; a sentence that the network is new and small; a link "Already running MeshCore in the valley?" → `/contact/`.
  - `/start/`: an ordered list with 7 steps in this order: what you need; check the repeater list (links `/repeaters/`, says what to do if none is near: use the contact form, think about a repeater, try from high ground); flash companion firmware at `https://flasher.meshcore.io`; pair the app and set the preset (value from settings), path hash size 2-byte, default region scope blank; add `#missoula`; test by sending on `#missoula` and looking for a reply; stuck → `/contact/`. Contains the untested note.
  - `/meshtastic/`: the 6 Ravalli Mesh links from spec §10 (`https://ravallimesh.org/`, `/join-the-community/`, `/new-coverage-missoula-frenchtown/`, `https://mesh.ravallimesh.org/`, `https://go.ravallimesh.org/s/chat`, `/best-practices/`), the sentence that MeshCore and Meshtastic radios cannot talk to each other, and no meetup dates (no month names followed by a day number).
  - `/about/`: who runs it (one person in Missoula, no names required), `hello@missoulamesh.org`, link to `/contact/`, content license "CC BY 4.0" and code license "MIT".
- [ ] **Step 2:** Run `npm run build && node --test tests/build`. Expected: FAIL.
- [ ] **Step 3:** Write the pages in plain words. Explain "repeater", "companion", and "flash" the first time each appears on `/start/`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat: home, start, meshtastic, about pages`

---

### Task 6: Contact form and server

**Files:**
- Create: `src/components/ContactForm.astro`, `server/contact.js`, `server/mailer.js`, `server/app.js`, `server/index.js`
- Modify: `src/content/docs/contact.mdx`, `contact/thanks.mdx`, `contact/error.mdx`
- Test: `tests/server/contact.test.js`, `tests/server/mailer.test.js`, `tests/server/app.test.js`, `tests/build/contact-page.test.js`

**Interfaces:**
- Produces:
  - `parseContact(body: object, nowMs: number) -> { ok: true, value: {name, email, role, message} } | { ok: false, reason: 'invalid' | 'spam' }`
  - `createResendSender({ apiKey, from, to, fetchImpl = fetch }) -> (msg: {name, email, role, message}) => Promise<void>`; throws if `apiKey` or `to` is missing or Resend returns non-2xx.
  - `createApp({ distDir, sendMail, csp, rateLimit = { windowMs: 3600000, limit: 5 }, now = Date.now }) -> express.Application`
  - Form fields (names fixed): `name`, `email`, `role` (`new` | `experienced` | `other`), `message`, `website` (honeypot, visually hidden, `tabindex="-1"`, `autocomplete="off"`), `ts` (filled by a small self-hosted script with `Date.now()` on page load; empty when JS is off).
  - Routes: `POST /api/contact` → 303 to `/contact/thanks/` (sent, or spam — bots get no signal) or `/contact/error/?reason=invalid|rate|send`. `GET /api/health` → 200 `{ "ok": true }`. Everything else: static from `distDir`; unknown paths → `distDir/404.html` with status 404.
  - `server/index.js` env: `PORT` (default 3200), `HOST` (default `0.0.0.0`), `DIST_DIR` (default `dist`), `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` (default `Missoula Mesh <contact@missoulamesh.org>`). Logs a warning at start if mail is not configured; still serves.

- [ ] **Step 1: Write failing tests**
  - `parseContact`: valid body → ok; `name` with `\r\n` → invalid; `name` > 100 chars → invalid; `email` `'a b@c'` or `'nope'` → invalid; `email` > 254 → invalid; `role: 'admin'` → invalid; `message` empty or > 5000 chars → invalid; `website: 'x'` → spam; `ts` = now − 1000 → spam; `ts` = now − 5000 → ok; `ts` empty → ok (JS off).
  - `createResendSender` with a fake `fetchImpl`: POSTs to `https://api.resend.com/emails` with header `Authorization: Bearer <key>`, JSON `{ from, to: [to], reply_to: email, subject, text }`; subject is `Missoula Mesh contact: <role label> from <name>`; text includes name, email, role label, message. Role labels: new → "New to MeshCore", experienced → "Already uses MeshCore", other → "Other". Non-2xx → throws. Missing `apiKey` → throws without calling fetch.
  - `createApp` (listen on port 0, use `fetch`, `redirect: 'manual'`):
    - valid form POST (urlencoded) → 303 `/contact/thanks/`, `sendMail` called once with parsed value.
    - invalid → 303 `/contact/error/?reason=invalid`, `sendMail` not called.
    - honeypot filled → 303 `/contact/thanks/`, `sendMail` not called.
    - `sendMail` rejects → 303 `/contact/error/?reason=send`; then `GET /api/health` → 200.
    - 6 posts with `X-Forwarded-For: 1.1.1.1` and `limit: 5` → 6th is 303 `?reason=rate`; a post with `X-Forwarded-For: 2.2.2.2` still → thanks.
    - body over 20 kb → 303 `?reason=invalid` (or 413 handled into that redirect).
    - `GET /does-not-exist` → 404 with HTML.
  - Build test: `/contact/` has a `<form method="post" action="/api/contact">` with a visible `<label>` for each of name, email, role, message; inputs have `required`, `autocomplete` (`name`, `email`); the honeypot field exists; `hello@missoulamesh.org` is on the page. `/contact/error/` shows `hello@missoulamesh.org`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement. Use `express.urlencoded({ extended: false, limit: '20kb' })`, `app.set('trust proxy', 1)`, `express-rate-limit` on `POST /api/contact` only, with a handler that redirects to `?reason=rate`. Static via `express.static(distDir)`.
- [ ] **Step 4:** Run `npm run build && npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: contact form with Resend sender and Node server`

---

### Task 7: Security headers and CSP

**Files:**
- Create: `server/csp.js`, `scripts/csp-hashes.js`
- Modify: `server/app.js` (header middleware), `server/index.js` (read `dist/csp-hashes.json`), `package.json` build script
- Test: `tests/server/csp.test.js`, `tests/server/headers.test.js`

**Interfaces:**
- Produces:
  - `collectInlineScriptHashes(distDir: string) -> Promise<string[]>`: sorted, unique `'sha256-<base64>'` of every inline `<script>` body in `dist/**/*.html`.
  - `buildCsp(scriptHashes: string[]) -> string`:
    `default-src 'self'; script-src 'self' <hashes> 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'`
  - `dist/csp-hashes.json`: `{ "scriptHashes": [...] }`.
  - Every response from `createApp` has: `Content-Security-Policy` (the `csp` option), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=31536000`.

- [ ] **Step 1: Write failing tests:** `collectInlineScriptHashes` on a temp dir with two HTML files and one shared inline script returns exactly one hash equal to `'sha256-' + base64(sha256(body))`; ignores `<script src=...>`. `buildCsp([])` contains no `http` and contains `form-action 'self'`. `GET /` and `POST /api/contact` responses carry all 5 headers.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement. Add `node scripts/csp-hashes.js` to the build script after `astro build`.
- [ ] **Step 4:** Run `npm run build && npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: security headers and hashed CSP`

---

### Task 8: Quality gates (third-party scan, accessibility, CSP in a real browser)

**Files:**
- Create: `scripts/check-external.js`, `playwright.config.js`, `tests/e2e/a11y.spec.js`, `tests/build/external.test.js`
- Modify: `package.json` build script

**Interfaces:**
- Produces: `findExternalResources(html: string, siteOrigin = 'https://missoulamesh.org') -> string[]` exported from `scripts/check-external.js`; the CLI exits 1 and prints file + URL when any built page has one. Checked: `script[src]`, `link[href]` with rel `stylesheet|icon|preload|modulepreload|manifest`, `img[src]`, `img[srcset]`, `source[src|srcset]`, `iframe[src]`, `video|audio[src]`, CSS `url(...)` and `@import` in built `.css`. Not checked: `a[href]`.
- Playwright `webServer`: `DIST_DIR=dist PORT=3201 node server/index.js`, `baseURL: http://127.0.0.1:3201`.

- [ ] **Step 1: Write failing tests:**
  - `findExternalResources('<script src="https://cdn.x/a.js"></script>')` → 1 item; `'<a href="https://ravallimesh.org/">'` → 0; `'<link rel="stylesheet" href="https://fonts.googleapis.com/css">'` → 1; `'<img src="/a.png">'` → 0.
  - `a11y.spec.js`: for each of the 9 routes, in light and in dark (`page.emulateMedia({ colorScheme })` plus Starlight's theme storage key `starlight-theme`), run axe with tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` → 0 violations; no console message containing "Content Security Policy"; at width 320 the page has no horizontal scroll (`scrollWidth <= clientWidth`). One test tabs through `/contact/` and checks focus reaches name, email, role, message, and the submit button, and never the honeypot.
- [ ] **Step 2:** Run `npm run build && npm test && npx playwright install chromium && npm run test:e2e`. Expected: FAIL first (missing script/spec), then real violations if any.
- [ ] **Step 3:** Implement `check-external.js` and add it to the build script after `csp-hashes.js`. Fix any axe or CSP findings in components or theme (not by disabling rules).
- [ ] **Step 4:** Run the full chain again. Expected: PASS. Then do the manual keyboard pass on `/` and `/start/` and note the result in `docs/accessibility.md` (date, pages, what was checked, result).
- [ ] **Step 5: Commit** `test: third-party scan, axe, CSP, and 320px checks`

---

### Task 9: Docker image, deploy files, and CI

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `deploy/missoulamesh/docker-compose.yml`, `deploy/missoulamesh/deploy.sh`, `deploy/missoulamesh.caddy`, `deploy/setup-app.sh`, `deploy/README.md`, `.github/workflows/ci-deploy.yml`
- Reference (read only): `/home/matt/repos/hamlicenselookup/deploy/ham-finder/deploy.sh`, `/home/matt/repos/hamlicenselookup/deploy/setup-app.sh`, `/home/matt/repos/hamlicenselookup/.github/workflows/ci-deploy.yml`, `/home/matt/repos/hamlicenselookup/deploy/README.md`

**Interfaces:**
- Consumes: `npm run build`, `server/index.js`, `GET /api/health`.
- Produces:
  - Image: stage 1 `node:24-bookworm-slim`, `npm ci`, `npm run build`; stage 2 `node:24-bookworm-slim`, `npm ci --omit=dev`, copies `dist/` and `server/`, `ENV NODE_ENV=production PORT=3200 HOST=0.0.0.0 DIST_DIR=/app/dist`, `USER node`, `EXPOSE 3200`, `HEALTHCHECK` with `node -e "fetch('http://127.0.0.1:3200/api/health')..."` (same form as ham-finder).
  - Compose: service `app`, `container_name: missoulamesh`, `image: __IMAGE__:${IMAGE_TAG}`, `env_file: [{ path: contact.env, required: false }]`, network `web` (external), `restart: unless-stopped`, `mem_limit: 128m`, logging json-file 10m × 3. No volumes.
  - `deploy.sh <tag>`: same as ham-finder's (tag regex, `set_tag`, pull, up, two consecutive healthy checks on port 3200, rollback to `last-good-tag`, prune old images) minus the schema check and setup service. `APP_DIR` default `/srv/apps/missoulamesh`.
  - Caddy template:
    ```
    __DOMAIN__ {
    	encode gzip
    	reverse_proxy missoulamesh:3200
    }
    www.__DOMAIN__ {
    	redir https://__DOMAIN__{uri} permanent
    }
    ```
  - `setup-app.sh <domain> <image>` (root, idempotent): creates `/srv/apps/missoulamesh`, writes compose from template, installs `deploy.sh` (755 root), creates `contact.env` with `RESEND_API_KEY=` and `CONTACT_TO=` lines only if missing (mode 600, root), writes `/srv/apps/caddy/sites/missoulamesh.caddy`, reloads Caddy. No systemd units.
  - Workflow: same two jobs as ham-finder. `test` job: `npm ci`, `npm run lint`, `npm run build`, `npm test`, `npx playwright install --with-deps chromium`, `npm run test:e2e`, Docker build (no push). `deploy` job on push to `main`: build and push `ghcr.io/<owner>/<repo>:<sha>` and `:latest`, then `ssh "deploy@$DEPLOY_HOST" deploy missoulamesh "$GITHUB_SHA"`.
  - `deploy/README.md` owner checklist, in order: (1) buy `missoulamesh.org` at Namecheap; (2) Namecheap Advanced DNS: A `@` and A `www` → droplet IP; (3) Namecheap email forwarding `hello@` → owner's Gmail (needs Namecheap BasicDNS); (4) Resend: create account, add domain `missoulamesh.org`, add its DNS records in Namecheap, wait for verified, create an API key with send-only access; (5) create GitHub repo, push `main`, branch protection requiring `test`; (6) `ssh-keygen -t ed25519 -f missoulamesh-deploy -N ''`, copy the public key and `deploy/` to the droplet, run `/srv/apps/bin/add-deploy-key missoulamesh "$(cat missoulamesh-deploy.pub)"`; (7) GitHub secrets `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`; (8) first push builds the image, make the GHCR package public; (9) as root `bash deploy/setup-app.sh missoulamesh.org ghcr.io/<owner>/<repo>`, then put the Resend key and Gmail address in `/srv/apps/missoulamesh/contact.env`; (10) re-run the workflow; (11) checks: open `https://missoulamesh.org`, `https://www.missoulamesh.org` redirects, send a test message through `/contact/` and see it in Gmail with Reply-To set, email `hello@missoulamesh.org` from another account and see it arrive. Note that the site can be deployed before the domain is bought by skipping steps 1–3 and setup-app until then.

- [ ] **Step 1:** Write the files above.
- [ ] **Step 2:** Run `bash -n deploy/missoulamesh/deploy.sh deploy/setup-app.sh` and `shellcheck deploy/missoulamesh/deploy.sh deploy/setup-app.sh` (if installed). Expected: no errors.
- [ ] **Step 3:** Run `docker build -t missoulamesh:local .` then `docker run --rm -d --name mm-test -p 127.0.0.1:3299:3200 missoulamesh:local`, poll `until curl -sf http://127.0.0.1:3299/api/health; do sleep 1; done`, then `curl -sI http://127.0.0.1:3299/` shows `200` and a `Content-Security-Policy` header; `docker inspect --format '{{.State.Health.Status}}' mm-test` → `healthy`. Then `docker stop mm-test`.
- [ ] **Step 4:** Run `npx --yes @action-validator/cli .github/workflows/ci-deploy.yml` or `actionlint` if available. Expected: no errors.
- [ ] **Step 5: Commit** `ci: Docker image, deploy files, and CI/deploy workflow`

---

## After Release 1 (not in this plan)

Release 2 (after the owner's repeater test): `/get-involved`, `/repeater`, `/naming`, `/hardware`, `/faq`; flip `tested` to `true`; home "I already use MeshCore" → `/get-involved/`. Plan it separately when the owner is ready.
