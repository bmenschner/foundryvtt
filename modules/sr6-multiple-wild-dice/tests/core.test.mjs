import assert from "node:assert/strict";
import { parseCount, installCount, validateMode } from "../scripts/core.mjs";

for (const value of [-1, 1.5, "oops", 101, Infinity]) {
  assert.throws(() => parseCount(value));
}
assert.equal(parseCount("3"), 3);
assert.equal(parseCount(0), 0);
const a = { pool: 12, useWildDie: 0 };
const b = { pool: 8, useWildDie: 0 };
installCount(a, 3);
installCount(b, 2);
await Promise.resolve();
a.useWildDie = 1; // The system assigns this after asynchronous Edge updates.
b.useWildDie = 1;
assert.equal(a.useWildDie, 3);
assert.equal(b.useWildDie, 2);
a.pool = 2;
assert.equal(a.useWildDie, 2);
a.pool = 0;
assert.equal(a.useWildDie, 0);

// Follow Eden's delayed submission: read its base, apply regular modifiers,
// then calculate normal and wild dice from the final configured pool.
function submit(pool, replace, add, modifier = 0, cap = Infinity) {
  const configured = {pool, useWildDie: 0};
  const release = installCount(configured, replace, add);
  configured.useWildDie = replace + add > 0 ? 1 : 0;
  configured.pool = Math.min(cap, Math.max(0, configured.pool + modifier));
  const result = {total: configured.pool, wild: configured.useWildDie, normal: configured.pool - configured.useWildDie};
  release();
  assert.equal(configured.useWildDie, result.wild);
  assert.equal(configured.pool, result.total);
  return result;
}
assert.deepEqual(submit(12, 0, 3), {total:15, normal:12, wild:3});
assert.deepEqual(submit(12, 3, 2), {total:14, normal:9, wild:5});
assert.deepEqual(submit(12, 3, 0), {total:12, normal:9, wild:3});
assert.deepEqual(submit(0, 0, 2), {total:2, normal:0, wild:2});
assert.deepEqual(submit(2, 5, 3), {total:5, normal:0, wild:5});
assert.deepEqual(submit(12, 3, 2, -4), {total:10, normal:5, wild:5});
assert.deepEqual(submit(12, 3, 2, 0, 10), {total:10, normal:5, wild:5});
assert.deepEqual(submit(1, 0, 3, -3), {total:1, normal:0, wild:1});
const extraA = {pool:12};
const extraB = {pool:8};
installCount(extraA, 1, 3);
installCount(extraB, 2, 1);
await Promise.resolve();
extraA.useWildDie = 1;
extraB.useWildDie = 1;
for (let i = 0; i < 5; i++) {
  assert.equal(extraA.pool, 15);
  assert.equal(extraA.useWildDie, 4);
  assert.equal(extraB.pool, 9);
  assert.equal(extraB.useWildDie, 3);
}
const incompatible = {pool:12};
Object.defineProperty(incompatible, 'useWildDie', {get: () => 1});
assert.throws(() => installCount(incompatible, 1, 3));
assert.equal(incompatible.pool, 12);
a.pool = 15;
assert.equal(JSON.parse(JSON.stringify(a)).useWildDie, 3);
a.useWildDie = 0;
assert.equal(a.useWildDie, 0);
assert.throws(() => validateMode(3, { explode: true }));
assert.throws(() => validateMode(3, { buying: true }));
assert.throws(() => validateMode(3, { extended: true, threshold: 5 }));
validateMode(3, { extended: true, threshold: 0 });
validateMode(1, { explode: true });
console.log("Core checks passed: replacement/addition, delayed assignment, independent dialogs, pool limits and modes.");
