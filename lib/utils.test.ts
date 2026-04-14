// lib/utils.test.ts — run with: npx tsx lib/utils.test.ts
import assert from 'assert';
import { getSurname } from './utils';

assert.strictEqual(getSurname("Yuval Noah Harari"), "harari");
assert.strictEqual(getSurname("Orwell"), "orwell");
assert.strictEqual(getSurname("  George  Orwell  "), "orwell");
assert.strictEqual(getSurname(""), "");
assert.strictEqual(getSurname("J.K. Rowling"), "rowling");
console.log("getSurname: all tests passed ✓");
