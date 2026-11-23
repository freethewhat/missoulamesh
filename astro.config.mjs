// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

export default defineConfig({
  site: 'https://missoulamesh.org',
  build: { inlineStylesheets: 'never' },
  integrations: [
    starlight({
      title: 'Missoula Mesh',
      logo: { light: './src/assets/badge-light.svg', dark: './src/assets/badge-dark.svg', alt: '' },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/theme.css'],
      components: { Hero: './src/components/HomeHero.astro' },
      description: 'Western Montana MeshCore: off-grid text messages, built by neighbors in the Missoula Valley.',
      plugins: [starlightLinksValidator()],
      sidebar: [
        {
          label: 'Get started',
          items: [
            { label: 'I just got a device', link: '/start/' },
            { label: 'Repeaters', link: '/repeaters/' },
            { label: 'Device settings', link: '/settings/' },
          ],
        },
        {
          label: 'Community',
          items: [
            { label: 'Contact', link: '/contact/' },
            { label: 'Meshtastic?', link: '/meshtastic/' },
            { label: 'About', link: '/about/' },
          ],
        },
      ],
    }),
  ],
});
