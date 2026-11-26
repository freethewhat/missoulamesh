# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Missoula Mesh: a community site for MeshCore radio users in western Montana. It is an Astro + Starlight static site, served by a small Express app that also handles the contact form. Node >= 22 (CI and Docker use Node 24).

## Commands

- `npm run dev`: Astro dev server.
- `npm run build`: `astro build`, then two post-build scripts (see below). Run this before `npm test`.
- `npm test`: Node's built-in test runner over `tests/lib`, `tests/build`, `tests/server`.
- One test file: `node --test tests/lib/schemas.test.js`. One test by name: add `--test-name-pattern "pattern"`.
- `npm run test:e2e`: Playwright. It starts `node server/index.js` on port 3201 against `dist/`, so build first. Needs `npx playwright install chromium` once.
- `npm run lint`: ESLint.
- `npm start`: serve `dist/` on port 3200 (env: `PORT`, `HOST`, `DIST_DIR`, `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`).
- `node scripts/og-image.js`: rebuild `public/og-image.png` and `public/logo.png` from the SVGs in `src/assets/`. Run it by hand after you change those SVGs.

CI (`.github/workflows/ci-deploy.yml`) runs lint, build, test, e2e, and a Docker build. A push to `main` also deploys.

## Architecture

**Pages.** Content lives in `src/content/docs/*.mdx` (Starlight docs collection). The sidebar is set by hand in `astro.config.mjs`. A new page needs a sidebar entry there and, usually, an entry in `ROUTES` in `tests/build/helpers.js` (build tests and e2e a11y tests loop over it). `starlight-links-validator` fails the build on broken internal links.

**Data.** Repeaters, hardware, and radio settings are JSON in `src/data/`. `src/lib/data.js` parses them with the zod schemas in `src/lib/schemas.js` at build time, so bad data fails the build. Components in `src/components/` import from `src/lib/data.js` and are used inside the MDX pages. Pure logic (`channels.js`, `hardware.js`, `path-hash.js`, `repeater-details.js`) is in `src/lib/` and is unit tested in `tests/lib/`. Routine site updates (repeater status, settings `"tested"`) are edits to these JSON files.

**Starlight overrides.** `astro.config.mjs` replaces `Hero`, `ThemeProvider`, and `ThemeSelect`. The custom ThemeProvider makes light the default theme (Starlight's default is auto). Colors and fonts are in `src/styles/theme.css`.

**CSP pipeline.** This is the part that spans many files:
- The server sets a strict CSP (`server/csp.js`): scripts, styles, fonts, and images from `'self'` only. Inline scripts are allowed by SHA-256 hash only.
- After `astro build`, `scripts/csp-hashes.js` hashes every inline `<script>` in `dist/` into `dist/csp-hashes.json`. `server/index.js` reads that file at startup.
- `scripts/check-external.js` fails the build if any page loads a resource (script, stylesheet, font, image, embed) from another origin. Outside `<a href>` links are fine.
- `astro.config.mjs` sets `inlineStylesheets: 'never'` and `assetsInlineLimit: 0` so nothing becomes a `data:` font or inline style that the CSP would block.
- So: never add third-party CDNs, fonts, or embeds. Self-host everything (fonts come from `@fontsource-variable`). The e2e tests fail on any CSP console error.

**Server.** `server/app.js` (`createApp`, injectable `sendMail`, `csp`, rate limit, and clock for tests) serves `dist/`, sets all security headers, exposes `/api/health`, and handles `POST /api/contact`. The contact form is a plain HTML form post (no client JS). `server/contact.js` validates it (honeypot plus timing check; spam silently goes to the thanks page). `server/mailer.js` sends through Resend. Every result is a 303 redirect to `/contact/thanks/` or `/contact/error/?reason=...`.

**Tests.** `tests/build/*` read the built HTML in `dist/` (helpers in `tests/build/helpers.js`) and assert on page content, SEO tags, and theme CSS. `tests/server/*` test the Express app with injected fakes. `tests/e2e/a11y.spec.js` runs axe (WCAG 2.2 AA) on every route in light and dark, checks 320 px width, keyboard order on the contact form, and CSP errors. See `docs/accessibility.md`.

## Accessibility

Every page must pass WCAG 2.2 AA in both light and dark themes. This is a requirement, not a goal.
- Add each new route to `ROUTES` in `tests/build/helpers.js` so the axe checks in `tests/e2e/a11y.spec.js` cover it.
- Run `npm run build && npm run test:e2e` before you call a page or style change done.
- Check text contrast in both themes when you change colors in `src/styles/theme.css`. A color that is fine as a fill may be too light for text.
- Keep a visible focus ring on every focusable element, and no horizontal scroll at 320 px.
- Log manual checks and fixes in `docs/accessibility.md`.

## Git: ask first

Do not commit or push unless the user asks in the current conversation. Approval for one commit or push does not cover the next one.

`main` is protected on GitHub. Nobody can push to it directly, and nobody can bypass that. Do the work on a branch, push the branch, and open a PR. The CI `test` job must pass before the PR can merge. Do not merge PRs: a maintainer reviews and merges them. A merge to `main` deploys the live site.

## Deploy

Docker image (multi-stage `Dockerfile`) pushed to GHCR, then CI runs `ssh deploy@$DEPLOY_HOST deploy missoulamesh <sha>` on a shared DigitalOcean droplet behind Caddy. The deploy health-checks and rolls back on failure. Server setup and secrets are in `deploy/README.md`; the contact env file lives only on the server.

## Writing style

Site copy is plain, short-sentence English. The site is run by the community, not owned: phrase guidance as suggestions, not rules. Design docs and plans are in `docs/superpowers/`.
