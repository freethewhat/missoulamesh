// Picks devices from hardware.json: by explicit ids (in that order), or by role and triedHere.
export function pickHardware(list, { role, triedHere, ids } = {}) {
  if (ids) return ids.map((id) => list.find((d) => d.id === id)).filter(Boolean);
  return list.filter((d) => d.role === role && d.triedHere === triedHere);
}
