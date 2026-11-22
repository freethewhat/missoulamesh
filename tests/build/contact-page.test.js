import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPage, pageText } from './helpers.js';

const html = () => readPage('/contact/');

test('contact page has a post form to /api/contact', () => {
  assert.match(html(), /<form[^>]+method="post"[^>]+action="\/api\/contact"/);
});

for (const [field, tag] of [['name', 'input'], ['email', 'input'], ['role', 'select'], ['message', 'textarea']]) {
  test(`contact field ${field} has a label and is required`, () => {
    const h = html();
    assert.match(h, new RegExp(`<label[^>]+for="mm-${field}"`));
    assert.match(h, new RegExp(`<${tag}[^>]+id="mm-${field}"[^>]+name="${field}"[^>]*required`));
  });
}

test('name and email have autocomplete', () => {
  assert.match(html(), /id="mm-name"[^>]+autocomplete="name"/);
  assert.match(html(), /id="mm-email"[^>]+autocomplete="email"/);
});

test('role offers the three choices', () => {
  const h = html();
  for (const v of ['new', 'experienced', 'other']) assert.match(h, new RegExp(`<option value="${v}"`));
});

test('honeypot field exists, hidden from keyboard and autofill', () => {
  assert.match(html(), /<input[^>]+name="website"[^>]+tabindex="-1"[^>]+autocomplete="off"/);
});

test('elapsed field exists', () => {
  assert.match(html(), /<input[^>]+type="hidden"[^>]+name="elapsed"/);
});

test('contact and error pages show the fallback email', () => {
  assert.ok(pageText('/contact/').includes('hello@missoulamesh.org'));
  assert.ok(pageText('/contact/error/').includes('hello@missoulamesh.org'));
});
