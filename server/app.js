import express from 'express';
import rateLimit from 'express-rate-limit';
import { join } from 'node:path';
import { parseContact } from './contact.js';

const ERROR = (reason) => `/contact/error/?reason=${reason}`;
const THANKS = '/contact/thanks/';

export function createApp({ distDir, sendMail, csp, rateLimit: rl = { windowMs: 3_600_000, limit: 5 }, now = Date.now }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use((req, res, next) => {
    if (csp) res.set('Content-Security-Policy', csp);
    next();
  });

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  const limiter = rateLimit({
    windowMs: rl.windowMs,
    limit: rl.limit,
    standardHeaders: false,
    legacyHeaders: false,
    handler: (req, res) => res.redirect(303, ERROR('rate')),
  });

  app.post(
    '/api/contact',
    limiter,
    express.urlencoded({ extended: false, limit: '20kb' }),
    async (req, res) => {
      const parsed = parseContact(req.body, now());
      if (!parsed.ok) return res.redirect(303, parsed.reason === 'spam' ? THANKS : ERROR('invalid'));
      try {
        await sendMail(parsed.value);
        return res.redirect(303, THANKS);
      } catch (err) {
        console.error('contact send failed:', err.message);
        return res.redirect(303, ERROR('send'));
      }
    },
  );

  // Body too large or malformed on the contact route.
  // eslint-disable-next-line no-unused-vars
  app.use('/api/contact', (err, req, res, next) => res.redirect(303, ERROR('invalid')));

  app.use(express.static(distDir));

  app.use((req, res) => {
    res.status(404).sendFile(join(distDir, '404.html'), (err) => {
      if (err) res.end();
    });
  });

  return app;
}
