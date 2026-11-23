// MeshCore path hash size, as the app shows it. Mode 0 = 1-byte, 1 = 2-byte, 2 = 3-byte.
export function pathHashLabel(mode) {
  return `${mode + 1}-byte`;
}

