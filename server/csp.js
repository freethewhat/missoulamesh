import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const INLINE_SCRIPT_RE = /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

export async function collectInlineScriptHashes(distDir) {
  const hashes = new Set();
  for (const file of await htmlFiles(distDir)) {
    const html = await readFile(file, 'utf8');
    for (const m of html.matchAll(INLINE_SCRIPT_RE)) {
      if (m[1].trim() === '') continue;
      hashes.add(`'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
    }
  }
  return [...hashes].sort();
}

export function buildCsp(scriptHashes) {
  return [
    "default-src 'self'",
    ['script-src', "'self'", ...scriptHashes, "'wasm-unsafe-eval'"].join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}
