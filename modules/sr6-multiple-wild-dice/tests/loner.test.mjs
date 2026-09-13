import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installCount } from '../scripts/core.mjs';

function submit({ pool = 12, replace = 0, add = 0, loner = false, modifier = 0, cap = Infinity } = {}) {
  const configured = { pool, useWildDie: 0 };
  installCount(configured, replace, add, loner);
  configured.useWildDie = replace + add > 0;
  configured.pool = Math.min(cap, Math.max(0, configured.pool + modifier));
  return { total: configured.pool, normal: configured.pool - configured.useWildDie, wild: configured.useWildDie };
}

test('Einzelgänger adds one ordinary die only when selected', () => {
  assert.deepEqual(submit(), { total: 12, normal: 12, wild: 0 });
  assert.deepEqual(submit({ loner: true }), { total: 13, normal: 13, wild: 0 });
  assert.deepEqual(submit({ loner: true, replace: 3, add: 2 }), { total: 15, normal: 10, wild: 5 });
});

test('Einzelgänger observes pool modifiers, caps and zero floor', () => {
  assert.deepEqual(submit({ loner: true, modifier: -4 }), { total: 9, normal: 9, wild: 0 });
  assert.deepEqual(submit({ loner: true, cap: 12 }), { total: 12, normal: 12, wild: 0 });
  assert.deepEqual(submit({ pool: 0, loner: true, modifier: -2 }), { total: 0, normal: 0, wild: 0 });
});

test('Delayed system assignment and repeated reads do not duplicate or share the bonus', async () => {
  const first = { pool: 12, useWildDie: 0 };
  const second = { pool: 12, useWildDie: 0 };
  installCount(first, 3, 2, true);
  installCount(second, 3, 2, false);
  await Promise.resolve();
  first.useWildDie = second.useWildDie = true;
  for (let i = 0; i < 5; i++) {
    assert.equal(first.pool, 15);
    assert.equal(second.pool, 14);
    assert.equal(first.useWildDie, 5);
    assert.equal(second.useWildDie, 5);
  }
});
