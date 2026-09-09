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
a.pool = 15;
assert.equal(JSON.parse(JSON.stringify(a)).useWildDie, 3);
a.useWildDie = 0;
assert.equal(a.useWildDie, 0);
assert.throws(() => validateMode(3, { explode: true }));
assert.throws(() => validateMode(3, { buying: true }));
assert.throws(() => validateMode(3, { extended: true, threshold: 5 }));
validateMode(3, { extended: true, threshold: 0 });
validateMode(1, { explode: true });
console.log("Core checks passed: validation, delayed assignment, independent dialogs, pool limits and modes.");
