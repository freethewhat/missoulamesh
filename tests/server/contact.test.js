import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseContact } from '../../server/contact.js';

const NOW = 1_800_000_000_000;
const good = { name: 'Pat', email: 'pat@example.com', role: 'new', message: 'Hi there', website: '', elapsed: '' };
const run = (over) => parseContact({ ...good, ...over }, NOW);

test('valid form is ok', () => {
  assert.deepEqual(run({}), { ok: true, value: { name: 'Pat', email: 'pat@example.com', role: 'new', message: 'Hi there' } });
});
test('values are trimmed', () => {
  assert.equal(run({ name: '  Pat  ' }).value.name, 'Pat');
});
test('name with CR/LF is invalid', () => { assert.deepEqual(run({ name: 'Pat\r\nBcc: x@y.z' }), { ok: false, reason: 'invalid' }); });
test('name over 100 chars is invalid', () => { assert.equal(run({ name: 'a'.repeat(101) }).reason, 'invalid'); });
test('empty name is invalid', () => { assert.equal(run({ name: '' }).reason, 'invalid'); });
test('email with a space is invalid', () => { assert.equal(run({ email: 'a b@c.d' }).reason, 'invalid'); });
test('email without @ is invalid', () => { assert.equal(run({ email: 'nope' }).reason, 'invalid'); });
test('email over 254 chars is invalid', () => { assert.equal(run({ email: `${'a'.repeat(250)}@b.co` }).reason, 'invalid'); });
test('unknown role is invalid', () => { assert.equal(run({ role: 'admin' }).reason, 'invalid'); });
test('empty message is invalid', () => { assert.equal(run({ message: '   ' }).reason, 'invalid'); });
test('message over 5000 chars is invalid', () => { assert.equal(run({ message: 'x'.repeat(5001) }).reason, 'invalid'); });
test('missing fields are invalid', () => { assert.equal(parseContact({}, NOW).reason, 'invalid'); });
test('array field values are invalid', () => { assert.equal(run({ name: ['a', 'b'] }).reason, 'invalid'); });
test('filled honeypot is spam', () => { assert.equal(run({ website: 'http://spam' }).reason, 'spam'); });
test('submitted 1 second after load is spam', () => { assert.equal(run({ elapsed: '1000' }).reason, 'spam'); });
test('submitted 5 seconds after load is ok', () => { assert.equal(run({ elapsed: '5000' }).ok, true); });
test('empty elapsed (JavaScript off) is ok', () => { assert.equal(run({ elapsed: '' }).ok, true); });
test('missing elapsed is ok', () => { const b = { ...good }; delete b.elapsed; assert.equal(parseContact(b, NOW).ok, true); });
test('time check does not depend on the server clock (visitor clock 2 minutes fast)', () => {
  // Old design compared the browser's Date.now() to the server's; a fast clock looked like an instant submit.
  assert.equal(parseContact({ ...good, elapsed: '60000' }, NOW - 120_000).ok, true);
});
