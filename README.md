# Missoula Mesh

The code for [missoulamesh.org](https://missoulamesh.org). It is a community site for MeshCore radio users in western Montana.

The site is built with Astro and Starlight. A small Express server serves the pages and sends contact form mail.

## Run it locally

You need Node 22 or newer.

```sh
npm install
npm run dev
```

The dev server prints a local URL. Open it in your browser.

## Build and test

```sh
npm run build      # build the site into dist/
npm test           # unit, build, and server tests (run after a build)
npm run lint       # ESLint
npm run test:e2e   # Playwright and accessibility tests (run after a build)
```

Before your first e2e run, install the browser:

```sh
npx playwright install chromium
```

To serve the built site on port 3200:

```sh
npm start
```

## Update the site

Most updates are small edits:

- **Pages:** `src/content/docs/*.mdx`. Add a new page to the sidebar in `astro.config.mjs`.
- **Repeaters, hardware, and radio settings:** JSON files in `src/data/`. The build checks them, so bad data fails the build.
- **Colors and fonts:** `src/styles/theme.css`.

Every page must pass WCAG 2.2 AA in light and dark themes. See `docs/accessibility.md`.

The site loads nothing from other domains. Fonts and other files are self-hosted. A strict content security policy blocks outside scripts, styles, fonts, and images.

## Contributing

`main` is protected. To make a change:

1. Make a branch.
2. Open a pull request.
3. CI must pass before the pull request can merge.

A merge to `main` deploys the live site. Deploy details are in `deploy/README.md`.

## License

MIT
