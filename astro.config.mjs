// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
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
            { label: 'Host a repeater', link: '/host-a-repeater/' },
            { label: 'Contact', link: '/contact/' },
            { label: 'Meshtastic?', link: '/meshtastic/' },
            { label: 'About', link: '/about/' },
          ],
        },
      ],
    }),
  ],
});
