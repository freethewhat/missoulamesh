import { createHash } from 'node:crypto';

// MeshCore hashtag channel key: first 16 bytes of SHA-256 of the name, including '#'.
export function channelKey(name) {
  return createHash('sha256').update(name, 'utf8').digest('hex').slice(0, 32);
}
