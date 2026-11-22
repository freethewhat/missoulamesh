const ROLES = new Set(['new', 'experienced', 'other']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u001f\u007f]/;
const MIN_FILL_MS = 3000;

const str = (v) => (typeof v === 'string' ? v.trim() : null);

// eslint-disable-next-line no-unused-vars
export function parseContact(body, nowMs) {
  const b = body && typeof body === 'object' ? body : {};
  const honeypot = typeof b.website === 'string' ? b.website : '';
  if (honeypot.trim() !== '') return { ok: false, reason: 'spam' };

  // Milliseconds the visitor spent on the page, measured in the browser (one clock, so clock skew cannot matter).
  // Empty when JavaScript is off: then the check is skipped.
  const elapsed = typeof b.elapsed === 'string' && b.elapsed.trim() !== '' ? Number(b.elapsed) : null;
  if (elapsed !== null && Number.isFinite(elapsed) && elapsed < MIN_FILL_MS) return { ok: false, reason: 'spam' };

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
