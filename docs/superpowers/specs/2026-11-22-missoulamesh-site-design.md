# missoulamesh.org: Design

Date: 2026-11-22
Status: builder check done and owner answers added; waiting for owner approval
Research sources are listed in section 14.

## 1. Intent

There is no MeshCore group in the Missoula Valley and no one place to learn how to join. The owner is putting up a first repeater this week (2026-11-22). One other MeshCore repeater exists in town. It has been down for about 2 weeks, and the owner has not reached its operator yet. The owner will reach the operator through the local ham club.

missoulamesh.org is the home for MeshCore in the Missoula Valley. It shows that a group exists, gets a new person on the air, and invites people who already know MeshCore to get involved. The site goes up before the network is big, so the owner can say: "If you are in this part of Missoula, reach out. You can reach my repeater."

**Ravalli Mesh Network** (https://ravallimesh.org/) runs a good Meshtastic mesh in the Bitterroot Valley (mostly Hamilton and Corvallis) and plans to stay on Meshtastic. It already reaches toward Missoula: its "Frenchy" node sits on a tower between Missoula and Frenchtown, and it is working on a full Bitterroot-Missoula link. MeshCore and Meshtastic cannot talk to each other. This site is a friendly neighbor to Ravalli Mesh, not a rival.

## 2. Who it is for

1. **The new user (main audience).** They just got a MeshCore device and want to talk to the local MeshCore group. They may know nothing about radio.
2. **The experienced user.** They already know MeshCore, have hardware, or are from out of town. The site does not push them to build a repeater. It says: "If you want to get involved, let's get involved," and shows the ways to do it (say hi, share what you run, host a repeater if you want, help with the site).

## 3. Goals

- A new user can go from a device in the box to sending a message on `#missoula` by following one page.
- A new user can see, before they try, whether a repeater is near them, and what to do if none is.
- An experienced user can find the local settings (radio, regions, channels, names), the repeater guide, and a way to contact the owner and get involved.
- Existing MeshCore operators in the valley (like the operator of the down repeater) can find the group and get in touch.

## 4. Non-goals (for now)

- No Discord or chat server. Add it later, if the group grows and a volunteer will moderate it.
- No live map, no pins, no range circles. Repeaters are listed by area only.
- No observer or automatic status. This is a possible later phase. Do not build it now.
- No Meshtastic setup guides. One page points Meshtastic users to Ravalli Mesh.
- No user accounts, comments, or database.

## 5. Anti-goals (failure even if it works)

- **The site says something is working when it is not.** Repeater status must be honest, with a "last checked" date. A new user who tries, hears nothing, and was not warned will give up.
- **The site reads like a rival of Ravalli Mesh.**
- **The site buries a new user in jargon.** Plain words. Short steps. Explain any radio term right after it is used.

## 6. Constraints

- **One maintainer for now.** Keep things simple where it costs nothing. Do not give up features people need just to save upkeep. The owner said a contact form is essential, and that more tooling is fine if it serves the site better.
- **Hosting:** the owner's DigitalOcean VPS, in Docker, using the same pattern as `/home/matt/repos/hamlicenselookup/deploy/` (see section 9).
- **No CDNs and no third-party requests from pages.** Fonts, scripts, and images are served from the site itself. Links to outside sites (map.meshcore.io, flasher.meshcore.io, the MeshCore docs, vendors) are fine. Embeds are not.
- **WCAG 2.2 AA** on every page.
- **Settings may change.** MeshCore GitHub issue #945 says the US preset (62.5 kHz) may not meet FCC 15.247. No FCC action and no new MeshCore US preset were found as of 2026-11-22. Radio settings must live in one data file so one edit updates the whole site.
- **Privacy:** repeater locations are shown as an area name only, never an address or pin.
- **Email:** DigitalOcean blocks outgoing mail ports (25, 465, 587) by default. The contact form sends mail through Resend's HTTPS API, not SMTP.
- **Domain:** missoulamesh.org is **not bought yet**. The owner will buy it this week or as testing goes on. Build as if it is owned. Registrar and DNS: **Namecheap** (BasicDNS). The deploy README lists every DNS record: A records for `@` and `www`, Namecheap email forwarding, and Resend's sending records.

## 7. Approaches considered

| Approach | Trade-off | Result |
|---|---|---|
| **Astro + Starlight**, built into a static image | One data file feeds many pages. Menus, search, dark mode, and phone layout come built in. It is easy to add small scripts (copy buttons, name generator). Cost: a build step and Node packages. | **Chosen by owner** |
| Plain HTML/CSS/JS, no build step (like hamlicenselookup) | Nothing to update and it matches the other project. But settings repeat on many pages (this breaks the one-file rule), and menus and search must be written by hand. | Not chosen |
| Hugo | Similar to Astro. Small interactive tools are harder to add. | Dropped |
| Squarespace / Google Sites | Costs money or limits you. No single settings file and no copy buttons. Does not fit the VPS. | Dropped |
| Cloudflare Pages hosting | Free and simple, but the owner already runs a VPS with Docker and a deploy pipeline. | Dropped in favor of the VPS |

## 8. What the owner decided

- Astro + Starlight.
- Host on the owner's VPS in Docker, behind the existing Caddy.
- Email, not Discord, for now. `hello@missoulamesh.org` forwards to the owner's Gmail with Namecheap's free email forwarding. The site shows this address too.
- A contact form is essential, so people can reach the owner and get involved. It uses the site's own small handler plus Resend (see section 9a).
- The repeater list is kept by hand.
- Repeaters are shown by area only.
- Keep the hamlicenselookup rules: no CDNs, and WCAG 2.2 AA.
- Meshtastic users are pointed to Ravalli Mesh (ravallimesh.org).

## 9. Hosting and deploy (follow the existing server pattern)

The shared server setup has been run, and the VPS is live and hosting ham-finder (owner confirmed 2026-11-22). missoulamesh needs only the per-app steps (hamlicenselookup `deploy/README.md` step 12). Droplet size was not confirmed. ham-finder has `mem_limit: 1800m`, so keep missoulamesh very small (builder's call, about 64-128 MB).

The VPS already has (from `hamlicenselookup/deploy/README.md`):
- One Caddy container on ports 80/443 that imports `/srv/apps/caddy/sites/*.caddy`.
- Apps in `/srv/apps/<app>/`, each with its own Compose file on the external `web` network, with `mem_limit` and capped logs.
- GitHub Actions: on push to `main`, test, build the image, push it to GHCR tagged by commit SHA, then `ssh deploy@<host> deploy <app> <sha>`.
- A forced-command `deploy` user with one key per app (`/srv/apps/bin/add-deploy-key <app> <pubkey>`), and a per-app `deploy.sh` that pulls, health-checks twice, and rolls back to `last-good-tag` on failure.

For missoulamesh:
- App name `missoulamesh`, container `missoulamesh`, in `/srv/apps/missoulamesh/`.
- Image: multi-stage. A Node stage runs the Astro build. The final stage is **one small Node server** that serves `dist/` and handles `POST /api/contact`. It runs as non-root on an internal port, with a `/api/health` route used by the Docker health check and `deploy.sh` (same as ham-finder). One container, not two. *(Designer's call: a second container for only the form is more to run.)*
- `deploy/missoulamesh.caddy`: `missoulamesh.org` reverse-proxies to the container. `www.missoulamesh.org` redirects to the apex domain. Add security headers. The CSP allows nothing from other origins. To keep Starlight's dark-mode toggle and Pagefind search working, it may allow hashes of Starlight's own inline scripts (made at build time) and `'wasm-unsafe-eval'`. *(Designer's call.)*
- `deploy/missoulamesh/deploy.sh`, `docker-compose.yml`, and a setup script, adapted from ham-finder: no data volume, no jobs, no schema check, and a health check that does not need `node` in the final image. ham-finder's `setup-app.sh` hard-codes ham-finder, so missoulamesh gets its own copy.
- `deploy/README.md` with the owner's checklist: DNS A records, deploy key, GitHub secrets, first deploy, Caddy reload.
- This should need **no code change in hamlicenselookup** (its README step 12 covers adding an app). Moving the shared server setup into its own repo is a later cleanup and out of scope.

## 9a. Contact form

- Page `/contact`. Fields: name, email, "I am..." (new to MeshCore / already use MeshCore / other), message. Labels and errors meet WCAG 2.2 AA. It works with JavaScript off (a normal form post, then a thank-you page).
- The form posts to `/api/contact` on the same site. The handler checks the fields, then calls Resend's HTTPS API to send one email to the owner's Gmail. From is `contact@missoulamesh.org`. Reply-To is the visitor's email, so the owner clicks Reply in Gmail.
- Resend is a hosted service. Nothing extra runs on the VPS. The API key and the destination address live in `/srv/apps/missoulamesh/.env` and never in the repo or image.
- Spam: a hidden trap field, a minimum time-to-submit, a per-IP rate limit (in memory, for example 5 per hour), and a length limit. No CAPTCHA, because CAPTCHA services load from other sites.
- Nothing is stored on the server. If Resend fails, the visitor sees an error that gives `hello@missoulamesh.org` as a fallback.
- Owner setup (in the deploy README): make a Resend account, verify `missoulamesh.org` by adding Resend's DNS records in Namecheap, create an API key, and put it in `.env`.
- The CSP allows the form to post only to `self`.

## 10. Site content

### Data files (one source of truth each)

- `src/data/settings.json`: radio preset (name, frequency, bandwidth, SF, CR, CLI string), path hash mode, channel list, region names, last-reviewed date, and a short FCC note.
- `src/data/repeaters.json`: one entry per repeater with name, area served (a neighborhood name), status (`testing` | `on-air` | `down` | `unknown`), last-checked date, owner contact (optional), and notes.

Every page that shows a setting or a repeater reads it from these files. No value is typed into a page by hand.

**Repeater list at launch (owner's decision):** one entry, the owner's repeater, area "Lewis and Clark neighborhood", status `testing`. Do not list the other operator's repeater until the owner has talked to that operator. Areas are neighborhood names for now. A map may replace them later.

**Old status (designer's call):** the page shows the stored status and the last-checked date. If the date is more than 30 days old, a small self-hosted script in the browser shows "status unknown, last checked <date>" in place of the stored status. With JavaScript off, the date is still shown. No scheduled rebuild.

### Launch in two steps (owner's decision: small launch)

- **Release 1 (launch):** `/` Home, `/start`, `/repeaters`, `/settings`, `/meshtastic`, `/contact`, `/about`. Pages that show settings carry a visible "not yet tested locally" note until the owner has tested them on the repeater. One flag in `settings.json` (for example `tested: false`) controls the note.
- **Release 2 (after the owner's repeater test):** `/get-involved`, `/repeater`, `/naming`, `/hardware`, `/faq`. Also remove the "not yet tested" note.

The home page's "I already use MeshCore" button goes to `/contact` in Release 1 and to `/get-involved` in Release 2.

### Pages (full set)

```
/            Home
/start       "I just got a device": step-by-step setup
/repeaters   Repeater list (area only, status, last checked)
/settings    Local settings: radio, companion, channels, regions
/hardware    A few recommended devices, with prices and where to buy
/get-involved "Get involved": who to contact, ways to help (repeaters are one option, not the ask), local settings links
/repeater    Repeater setup guide: copy-paste CLI block, delay profiles, key-prefix check, verify list
/naming      Naming rules + a small name generator
/meshtastic  Friendly pointer to Ravalli Mesh (see below)
/faq         MeshCore vs Meshtastic (fair), cost, no license needed, privacy, FCC note
/contact     Contact form (also in Release 1)
/about       Who runs it, license of the content
```

### Home page

```
MISSOULA MESH
Off-grid text messages, built by neighbors in the Missoula Valley.

[ I just got a device ]        -> /start
[ I already use MeshCore ] -> /contact (Release 1), /get-involved (Release 2)

Repeaters on the air: N   (from repeaters.json, with status and last checked)
Already running MeshCore in the valley? -> /contact
```

The home page says plainly that the network is new and small.

### /meshtastic page

Short and friendly. It says: "Want Meshtastic? Ravalli Mesh runs a good Meshtastic network in the Bitterroot, and it reaches toward Missoula." It explains in one line that MeshCore and Meshtastic radios cannot talk to each other. Links (all to ravallimesh.org, checked at build time on 2026-11-22):
- Home: https://ravallimesh.org/
- Join the Community: https://ravallimesh.org/join-the-community/
- Missoula / Frenchtown coverage: https://ravallimesh.org/new-coverage-missoula-frenchtown/
- Live node map (Ravalli Mesh Monitor): https://mesh.ravallimesh.org/
- Chat (Zulip): https://go.ravallimesh.org/s/chat
- Best Practices: https://ravallimesh.org/best-practices/
- Monthly meetups at HigherGround Brewing, Hamilton (link to their site for dates; do not copy dates)

### /start flow

1. What you need: a MeshCore device, a phone with the MeshCore app, and Chrome or Edge on a computer for flashing.
2. Check the repeater list. If nothing is near you, say so and give next steps (use the contact form; consider a repeater; try from high ground).
3. Flash companion firmware with flasher.meshcore.io.
4. Pair the app. Set the radio preset from `settings.json`. Set path hash size to 2-byte. Leave the default region scope blank.
5. Add the `#missoula` channel.
6. Test: send a message on `#missoula` and look for a reply.
7. Stuck? Use the contact form.

### Local settings (owner's calls to confirm while reading)

Taken from what other US MeshCore groups use. The owner will test them on a real repeater this week. The builder must check every CLI command against `docs.meshcore.io/cli_commands` before it is published.

- Radio: USA/Canada (Recommended), 910.525 MHz, BW 62.5 kHz, SF 7, CR 5. CLI `set radio 910.525,62.5,7,5`.
- Path hash mode: 2-byte (`set path.hash.mode 1`).
- Repeater: admin password changed from the default; guest password blank; `advert.interval 240`; `flood.advert.interval 24`; `flood.max 32`; `agc.reset.interval 500`; `loop.detect moderate`; `owner.info` includes `missoulamesh.org`; `clock sync` after each boot.
- Delay profiles (`set txdelay` / `set direct.txdelay` / `set rxdelay`), adapted from MichMesh and Denver:

  | Profile | Use | txdelay | direct.txdelay | rxdelay |
  |---|---|---|---|---|
  | PEAK | Mt. Sentinel, Mt. Jumbo, Blue Mtn, Bitterroot peaks | 2 | 2 | 3 |
  | BENCH | South Hills, Rattlesnake, high rooftops | 1.5 | 1 | 3 |
  | TOWN | Normal rooftop | 0.8 | 0.4 | 3 |
  | LOCAL | Indoor / low | 0.3 | 0.1 | 3 |
  | MOBILE | Vehicle / hiking | 2 | 2 | 3 |

- Key prefix: the first 4 hex characters of a repeater's public key must be unique nearby. Check before going live. If there is a match, make a new key with config.meshcore.io or gessaman.com/mc-keygen.
- Regions: define `us-mt` and `us-mt-mso` on repeaters. Do not set a default scope on repeaters or companions yet.
- Channels: Public, `#missoula`, `#montana`, `#testing`, `#emergency`. Show each hashtag channel's key for devices that cannot type `#`.
- Repeater name: `MSO-<PLACE>-<TYPE>-<KEY4>`, max 23 characters. Types: RC core, RE edge, RM mobile, TS room server.

## 10a. Look and feel (owner chose from mockups, 2026-11-22)

Mockups are in `.superpowers/brainstorm/` (`visual-style.html`, `logo.html`, `guide-layout.html`). That folder is local and not committed, so this section is the record of what was chosen.

- **Style: "Trail map."** It must feel familiar and local to Missoula and western Montana. Warm paper background, forest green, rust accents, faint topo contour lines, and a mountain-ridge band under the home page hero.
- **Starting colors** (the builder must check every text/background pair for WCAG 2.2 AA and adjust shades as needed; rust on paper is close to the 4.5:1 limit for small text):
  - Light: paper `#f4efe3`, ink `#2b2a24`, forest `#24452f`, rust `#b5562a`, line `#d8cfb8`
  - Dark: background `#1b2a20`, text `#f4efe3`, sage `#7fa98a`, light rust `#e58a5c`
- **Type:** serif headings (Georgia-style) and system sans for body text. Use system font stacks, or self-hosted fonts only (no Google Fonts).
- **Mark: "Trail badge."** A round patch with a peak that sends a signal (arcs from the summit). It has light and dark versions. It is also the favicon. Name "Missoula Mesh", with the tagline "Western Montana MeshCore". Final SVG is cleaned up from the mockup sketch.
- **Layout:**
  - Home: a full-width welcome page (Starlight splash) with the 2 buttons, the ridge band, and the repeater list.
  - Guide pages: Starlight's standard layout with a left menu, top search, and an on-page table of contents. The menu folds into a button on phones.
  - `/start` uses big numbered steps, copy buttons on settings, and the "not yet tested locally" note box (rust left border).
  - Repeater status tags: small colored labels (for example rust for TESTING).
- **Menu groups:** Get started (I just got a device, Repeaters, Local settings) and Community (Contact, Meshtastic?, About). Release 2 adds a Build/Operate group (Get involved, Repeater guide, Naming, Hardware, FAQ).

## 11. Quality checks

- No third-party requests from any page (checked in CI, e.g. by scanning the built HTML for external `src`/`href` on scripts, styles, fonts, and images).
- Accessibility: an automated axe scan of every built page in CI, plus a manual keyboard pass and a 320 px width check before launch.
- Data files are checked against a schema in CI. A bad `repeaters.json` fails the build.
- Internal links are checked in CI.
- The CI job builds the Docker image, the same as hamlicenselookup.

## 12. Later phases (not in this build)

- An observer node that runs all the time and reports to the LetsMesh analyzer, to give live "last heard" status.
- Discord, when a volunteer moderator appears.
- A map with pins, once there are mountain-top repeaters.
- Moving the shared Caddy/server setup out of hamlicenselookup into its own repo.

## 13. Left to the builder

- Screenshots: write `/start` so it works without them. The owner may add real app screenshots later. *(Designer's call.)*
- `mem_limit` for the container (keep it small; see section 9).
- The Node server's framework (or none), its port, and static-file caching headers.
- Fine detail of the look in section 10a (exact shades after the contrast check, spacing, the final badge SVG), within WCAG 2.2 AA.
- Exact page wording, following the plain-words rule.
- How the name generator and channel-key display work (small client-side scripts, self-hosted).
- Test tooling for the checks in section 11.
- The license for site content (default: CC BY 4.0 for text, MIT for code).

## 14. Research sources (read 2026-11-22)

- Denver MeshCore: https://denvermc.netlify.app/start (hardware, channels, repeater profiles, naming generator)
- MichMesh: https://michmesh.net/docs/MeshCore/Repeater-Setup (repeater CLI block, key-prefix check, regions RFC)
- Florida Mesh: https://areyoumeshingwith.us/docs/meshcore/regional-settings/ and https://areyoumeshingwith.us/docs/meshcore/configuration/
- Spokane Mesh: https://spokanemesh-net.pages.dev and https://groups.google.com/g/spokanemeshnet/c/9861SZsRXNs
- MeshCore Swansea: https://swansea.localmesh.org/regions
- MeshCore FAQ: https://docs.meshcore.io/faq/ and CLI: https://docs.meshcore.io/cli_commands
- Region filtering: https://blog.meshcore.io/2026/01/20/region-filtering
- FCC issue: https://hackaday.com/2026/09/17/fcc-ism-rules-may-shatter-lora-mesh-communities/ (MeshCore GitHub issue #945)
- Ravalli Mesh: https://ravallimesh.org/
