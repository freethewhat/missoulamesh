const ROLES = new Set(['new', 'experienced', 'other']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u001f\u007f]/;
const MIN_FILL_MS = 3000;

const str = (v) => (typeof v === 'string' ? v.trim() : null);

export function parseContact(body, nowMs) {
  const b = body && typeof body === 'object' ? body : {};
  const honeypot = typeof b.website === 'string' ? b.website : '';
  if (honeypot.trim() !== '') return { ok: false, reason: 'spam' };

  const ts = typeof b.ts === 'string' && b.ts.trim() !== '' ? Number(b.ts) : null;
  if (ts !== null && Number.isFinite(ts) && nowMs - ts < MIN_FILL_MS) return { ok: false, reason: 'spam' };

  const name = str(b.name);
  const email = str(b.email);
  const role = str(b.role);
  const message = str(b.message);
  const invalid = { ok: false, reason: 'invalid' };

  if (!name || name.length > 100 || CONTROL_RE.test(name)) return invalid;
  if (!email || email.length > 254 || !EMAIL_RE.test(email) || CONTROL_RE.test(email)) return invalid;
  if (!role || !ROLES.has(role)) return invalid;
  if (!message || message.length > 5000) return invalid;

  return { ok: true, value: { name, email, role, message } };
}
