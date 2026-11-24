// Render the social preview image and the logo (for search engines) to PNG files in public/.
// Run by hand after you change the SVG: node scripts/og-image.js
import sharp from 'sharp';

await sharp('src/assets/og-image.svg').png({ compressionLevel: 9, palette: true, quality: 90 }).toFile('public/og-image.png');
console.log('og-image: wrote public/og-image.png');

await sharp('src/assets/badge.svg', { density: 720 }).resize(512, 512).png({ compressionLevel: 9 }).toFile('public/logo.png');
console.log('og-image: wrote public/logo.png');
