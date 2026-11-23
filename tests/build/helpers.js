import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const DIST = new URL('../../dist/', import.meta.url).pathname;

export const ROUTES = ['/', '/start/', '/faq/', '/repeaters/', '/settings/', '/hardware/', '/meshtastic/', '/contact/', '/contact/thanks/', '/contact/error/', '/about/'];

export function pagePath(route) {
  return join(DIST, route, 'index.html');
}

export function readPage(route) {
  const p = pagePath(route);
  if (!existsSync(p)) throw new Error(`missing built page ${route} (${p})`);
  return readFileSync(p, 'utf8');
}

// Visible-ish text: tags stripped, whitespace collapsed.
export function pageText(route) {
  return readPage(route)
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');
}
