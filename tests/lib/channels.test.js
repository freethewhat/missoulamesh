import { test } from 'node:test';
import assert from 'node:assert/strict';
import { channelKey } from '../../src/lib/channels.js';

test('channelKey matches Denver MeshCore published key for #denver', () => {
  assert.equal(channelKey('#denver'), 'b24355a0d22ed2bf393ec530d75810b4');
});

test('channelKey matches Denver MeshCore published key for #testing', () => {
  assert.equal(channelKey('#testing'), 'cde5e82cf515647dcb547a79a4f065d1');
});
