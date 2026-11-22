// Post-build: fail if any built page or stylesheet loads a resource from another site.
// Outside links (<a href>) are fine; scripts, styles, fonts, images, and embeds are not.
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE = 'https://missoulamesh.org';
const RESOURCE_RELS = new Set(['stylesheet', 'icon', 'shortcut', 'apple-touch-icon', 'preload', 'modulepreload', 'manifest', 'prefetch']);

function isExternal(url, siteOrigin) {
  const u = url.trim();
  if (u.startsWith('//')) return true;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) return false; // relative or root-relative
  if (/^(data|blob):/i.test(u)) return false;
  try { return new URL(u).origin !== siteOrigin; } catch { return true; }
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4]) : null;
};

export function findExternalResources(html, siteOrigin = SITE) {
  const found = [];
  for (const [tag, name] of html.matchAll(/<(script|link|img|source|iframe|video|audio|embed|object)\b[^>]*>/gi)) {
    const el = name.toLowerCase();
    const urls = [];
    if (el === 'link') {
      const rels = (attr(tag, 'rel') || '').toLowerCase().split(/\s+/);
      if (rels.some((r) => RESOURCE_RELS.has(r))) urls.push(attr(tag, 'href'));
    } else if (el === 'object') {
      urls.push(attr(tag, 'data'));
    } else {
      urls.push(attr(tag, 'src'));
      const srcset = attr(tag, 'srcset');
      if (srcset) urls.push(...srcset.split(',').map((s) => s.trim().split(/\s+/)[0]));
    }
    for (const u of urls) if (u && isExternal(u, siteOrigin)) found.push(u);
  }
  return found;
}

export function findExternalCss(css, siteOrigin = SITE) {
  const found = [];
  for (const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) if (isExternal(m[2], siteOrigin)) found.push(m[2]);
  for (const m of css.matchAll(/@import\s+(['"])([^'"]+)\1/gi)) if (isExternal(m[2], siteOrigin)) found.push(m[2]);
  return found;
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const distDir = resolve(process.argv[2] || 'dist');
  const problems = [];
  for (const file of await walk(distDir)) {
    if (file.endsWith('.html')) for (const u of findExternalResources(await readFile(file, 'utf8'))) problems.push(`${file}: ${u}`);
    if (file.endsWith('.css')) for (const u of findExternalCss(await readFile(file, 'utf8'))) problems.push(`${file}: ${u}`);
  }
  if (problems.length) {
    console.error(`check-external: ${problems.length} third-party resource(s) found:\n${problems.join('\n')}`);
    process.exit(1);
  }
  console.log('check-external: no third-party resources');
}
