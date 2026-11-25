// MeshCore "add contact" link, as used in QR codes. See https://docs.meshcore.io/qr_codes/
export const CONTACT_TYPES = { companion: 1, repeater: 2, room: 3, sensor: 4 };

export function contactUri({ name, publicKey, type }) {
  const t = CONTACT_TYPES[type];
  if (!t) throw new Error(`unknown contact type: ${type}`);
  if (!/^[0-9A-Fa-f]{64}$/.test(publicKey)) throw new Error('public key must be 64 hex characters');
  const q = new URLSearchParams({ name, public_key: publicKey.toLowerCase(), type: String(t) });
  return `meshcore://contact/add?${q}`;
}
