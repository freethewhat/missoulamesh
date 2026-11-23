# Hardware, Host a Repeater, and Help pages: design

Date: 2026-11-23. Status: draft for owner approval.

## Why

A comparison with seven other MeshCore community sites (Puget Mesh, Vashon/Mesh101, MeshEnvy, EastMesh, VAMesh, Cumbria, RegionMesh) found that we are strong for new users but have four gaps:

1. No real hardware advice. We only say "a MeshCore-compatible radio, $30 to $80."
2. Nothing for someone who wants to host a repeater.
3. No help when setup fails. Step 7 only says "contact us."
4. No app download links.

The owner also wants a short "do not send" list in the FAQ privacy answer.

## Goals

- A new user can pick a radio and buy it from the maker.
- Someone who wants to host a repeater can set one up safely and match the valley settings.
- A stuck user can fix the common problems without writing to us.

## Non-goals and anti-goals

- **No rules.** The owner does not own the mesh, the frequency, or other people's repeaters. Everything is a tip. There is no naming pattern, no channel rules page, and no code of conduct. The only "must" is the radio preset (radios cannot hear each other without it). Safety tips (admin password, privacy) are fine.
- **No pressure to host a repeater.** The page title says "if you want." This changes the release-1 spec, which said repeater setup is out of scope. The owner asked for the page on 2026-11-23.
- **No affiliate links.** Plain links to the maker's store. The page says we earn nothing from them.
- No live map (we have none yet).
- No embeds or third-party requests (existing site rule).

## Approaches

- **A (chosen): 3 new pages and 2 small edits.** Each page has one job. The FAQ and the join page stay short.
- B: put hardware in the join page, troubleshooting in the FAQ, and repeater tips on the repeater list. Fewer pages, but the join page gets long and a new user can get lost in it.
- The old plan's `/get-involved` page is dropped for now. "Host a repeater" covers it.

## Navigation

- **Get started:** FAQ, Join the mesh, Hardware, Device settings, Repeaters, Help
- **Community:** Host a repeater, Contact, Meshtastic?, About

## Page: `/hardware/` "What to buy"

Data goes in `src/data/hardware.json` (name, role, maker, store URL, price in USD, short facts, `triedHere` flag, `lastChecked`). This works the same way as `settings.json`: one edit updates the page. Prices are shown as "about $44 (checked 2026-11-23)".

Sections:

1. **Intro.** For a phone, you need a **companion** radio: the one you pair with your phone. Some come with MeshCore already on them.
2. **Used in the valley**
   - Seeed Wio Tracker L1 Pro: about $44, with a screen, GPS, built-in battery, and case. Comes with MeshCore companion firmware. https://www.seeedstudio.com/Wio-Tracker-L1-Pro-for-Meshcore-p-6717.html
3. **Other popular picks (not yet tried here)**
   - RAK WisMesh Tag
   - Seeed SenseCAP T1000-E
   - Heltec V4: a bare board, so it needs a battery and a case. It moves to "Used in the valley" after the owner tests it.
4. **For a repeater:** see the Host a repeater page (the SenseCAP Solar Node P1-Pro is listed there).
5. **Tips:** buy the US 915 MHz version. Do not turn a radio on without its antenna attached. We earn nothing from these links.

## Page: `/host-a-repeater/` "Host a repeater (if you want)"

1. **What it does, and why height matters.** A repeater high up (a roof, a pole, a hill) helps everyone around it.
2. **One Missoula example.** MSO_LNC_MM_001 is a Seeed SenseCAP Solar Node P1-Pro: about $94, with a 5 W solar panel, batteries, antenna, and GPS. It comes with MeshCore repeater firmware. https://www.seeedstudio.com/SenseCAP-Solar-Node-P1-Pro-for-Meshcore-p-6741.html
3. **Setup steps**
   - Set the radio preset and path hash size from `/settings/` (pulled from `settings.json`). This is the one "must."
   - **Change the admin password.** The default is `password`. Anyone can log in until you change it.
   - Name it: tip, use the area name, not your street address.
   - Location is optional. Tip: use a rough spot, not your exact house.
   - Leave the advert settings at their defaults.
   - You can manage it from the MeshCore app over the radio after you log in as admin.
4. **Legal tip.** Do not add an amplifier. US unlicensed limits apply.
5. **Tell us about it** (contact link) so we can add it to the repeater list.

## Page: `/help/` "When it does not work"

Each item is a symptom and then a fix:

- **The app cannot find or pair with the radio.** Make sure you flashed "Companion" with Bluetooth. The default pairing code is `123456`. Remove the old pairing from your phone's Bluetooth settings and try again.
- **The flasher cannot see the radio.** Use Chrome or Edge. Use a USB cable that carries data, not a charge-only cable. On Linux, see the MeshCore FAQ about serial port permissions.
- **No reply on #missoula.** Check your settings against `/settings/`. Check if a repeater is near you, or try from higher ground. Tap Advert in the app. People may simply not be online, so try again later.
- **No repeaters in my list.** Tap Advert and wait. Check that your phone's clock is correct.
- **Start fresh.** Re-flash the radio. When you only want an update, do NOT erase all the memory, or you lose your MeshCore identity.
- **Still stuck?** Contact form.

Source: https://docs.meshcore.io/faq/

## Edits

- **`/start/` step 1:** links to the MeshCore app for iPhone (App Store), Android (Google Play), and the web app (https://app.meshcore.nz). The URLs come from https://meshcore.io. Also link "What to buy" (`/hardware/`).
- **`/start/` step 7:** link to `/help/` first, then the contact form.
- **`/faq/` "What do I need?":** link to `/hardware/`.
- **`/faq/` "Is it private?":** add a short list of things not to post on public channels: your home address or exact location, when you are away from home, passwords or channel keys, phone numbers, and other people's personal details.

## Tests

- Add build tests for the new pages, the same as the existing `tests/build/*.test.js` files.
- The existing internal-link and external-request checks must pass.
- Keep WCAG 2.2 AA.

## Left to the builder

- Verify the store URLs and prices for the RAK WisMesh Tag, SenseCAP T1000-E, and Heltec V4 (not confirmed on 2026-11-23). Use clean URLs with no affiliate tags.
- Verify that the App Store link works for US users (meshcore.io lists the NZ store link).
- Write every page in the site's plain-words style.

## Open question for the owner

- How is MSO_LNC_MM_001 mounted (roof, pole, height)? This is optional. Without an answer, the page leaves it out.
