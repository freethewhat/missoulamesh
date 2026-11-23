// MeshCore path hash size. The app shows bytes; the repeater CLI takes the mode number.
// Mode 0 = 1-byte, 1 = 2-byte, 2 = 3-byte.
export function pathHashLabel(mode) {
  return `${mode + 1}-byte`;
}

export function pathHashCli(mode) {
  return `set path.hash.mode ${mode}`;
}
