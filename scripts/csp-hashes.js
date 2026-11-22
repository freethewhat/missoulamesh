// Post-build: record hashes of every inline script so the server's CSP allows exactly those.
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { collectInlineScriptHashes } from '../server/csp.js';

const distDir = resolve(process.argv[2] || 'dist');
const scriptHashes = await collectInlineScriptHashes(distDir);
await writeFile(join(distDir, 'csp-hashes.json'), `${JSON.stringify({ scriptHashes }, null, 2)}\n`);
console.log(`csp-hashes: ${scriptHashes.length} inline script hash(es) written`);
