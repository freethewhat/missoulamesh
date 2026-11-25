import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactUri } from '../../src/lib/contact-uri.js';

const KEY = '0F8255674B5ED4CD7020E4484FD373C62E810A479EF818BA916B1D15D54BDFD5';

test('room link uses type 3 and the MeshCore add-contact form', () => {
  assert.equal(
    contactUri({ name: 'missoulamesh.org room', publicKey: KEY, type: 'room' }),
    `meshcore://contact/add?name=missoulamesh.org+room&public_key=${KEY.toLowerCase()}&type=3`,
  );
});
test('repeater link uses type 2', () => {
  assert.match(contactUri({ name: 'x', publicKey: KEY, type: 'repeater' }), /&type=2$/);
});
test('unknown type is rejected', () => {
  assert.throws(() => contactUri({ name: 'x', publicKey: KEY, type: 'router' }));
});
test('short public key is rejected', () => {
  assert.throws(() => contactUri({ name: 'x', publicKey: 'abcd', type: 'room' }));
});
