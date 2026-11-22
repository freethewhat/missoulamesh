import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createApp } from './app.js';
import { createResendSender } from './mailer.js';
import { buildCsp } from './csp.js';

const env = process.env;
const distDir = resolve(env.DIST_DIR || 'dist');
const port = Number(env.PORT || 3200);
const host = env.HOST || '0.0.0.0';

if (!env.RESEND_API_KEY || !env.CONTACT_TO) {
  console.warn('warning: RESEND_API_KEY or CONTACT_TO is not set. The contact form will show the error page.');
}

const sendMail = createResendSender({
  apiKey: env.RESEND_API_KEY,
  from: env.CONTACT_FROM || 'Missoula Mesh <contact@missoulamesh.org>',
  to: env.CONTACT_TO,
});

const hashesFile = join(distDir, 'csp-hashes.json');
const scriptHashes = existsSync(hashesFile) ? JSON.parse(readFileSync(hashesFile, 'utf8')).scriptHashes : [];
const csp = buildCsp(scriptHashes);

createApp({ distDir, sendMail, csp }).listen(port, host, () => {
  console.log(`missoulamesh listening on http://${host}:${port}`);
});
