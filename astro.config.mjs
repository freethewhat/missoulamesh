// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import starlightLinksValidator from 'starlight-links-validator';

export default defineConfig({
  site: 'https://missoulamesh.org',
  build: { inlineStylesheets: 'never' },
  // Never inline small assets (like font subsets) as data: URIs. The CSP allows fonts from 'self' only.
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [
    starlight({
      title: 'Missoula Mesh',
      logo: { src: './src/assets/badge.svg', alt: '' },
      favicon: '/favicon.svg',
      customCss: ['@fontsource-variable/recursive/wght.css', './src/styles/theme.css'],
      components: {
        Hero: './src/components/HomeHero.astro',
        ThemeProvider: './src/components/ThemeProvider.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
      description: 'Western Montana MeshCore: off-grid text messages, built by neighbors in the Missoula Valley.',
      // Link-preview picture for every page. Rebuild it with: node scripts/og-image.js
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://missoulamesh.org/og-image.png' } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: 'Missoula Mesh: radio waves over a mountain peak at night.' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://missoulamesh.org/og-image.png' } },
      ],
      plugins: [starlightLinksValidator()],
      sidebar: [
        {
          label: 'Get started',
          items: [
            { label: 'FAQ', link: '/faq/' },
            { label: 'Join the mesh', link: '/start/' },
            { label: 'What to buy', link: '/hardware/' },
            { label: 'Device settings', link: '/settings/' },
            { label: 'Repeaters', link: '/repeaters/' },
            { label: 'Help', link: '/help/' },
          ],
        },
        {
          label: 'Community',
          items: [
            { label: 'Room server', link: '/room/' },
            { label: 'Host a repeater', link: '/host-a-repeater/' },
            { label: 'Contact', link: '/contact/' },
            { label: 'Meshtastic?', link: '/meshtastic/' },
            { label: 'About', link: '/about/' },
          ],
        },
      ],
    }),
    // Keep the contact form's result pages out of search. They are also marked noindex.
    sitemap({ filter: (page) => !page.includes('/contact/thanks/') && !page.includes('/contact/error/') }),
  ],
});
