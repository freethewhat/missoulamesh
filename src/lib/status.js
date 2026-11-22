// Runs at build time and in the browser. No Node imports.
const DAY_MS = 24 * 60 * 60 * 1000;

export function effectiveStatus(entry, today, maxAgeDays = 30) {
  const checked = Date.parse(`${entry.lastChecked}T00:00:00Z`);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const ageDays = (now - checked) / DAY_MS;
  if (ageDays > maxAgeDays) return { status: 'unknown', stale: true };
  return { status: entry.status, stale: false };
}
