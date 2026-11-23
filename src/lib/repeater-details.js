// Extra lines shown under a repeater in the full list. Null fields are skipped.
export function repeaterDetails(r) {
  return [
    ['Name', r.name],
    ['Contact', r.contact],
  ].filter(([, v]) => v).map(([label, value]) => ({ label, value }));
}
