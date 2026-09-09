import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validate, plan, install } from '../scripts/deploy-modules.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-module-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'source');
  const target = path.join(root, 'data', 'Data', 'modules');
  const module = path.join(source, 'test-module');
  fs.mkdirSync(module, { recursive: true });
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(module, 'module.json'), JSON.stringify({id:'test-module',title:'Test',version:'1.0.0',compatibility:{minimum:'14'},esmodules:['main.mjs']}));
  fs.writeFileSync(path.join(module, 'main.mjs'), 'export const value = 1;');
  return {root, source, target, module};
}

test('installs, skips unchanged packages, preserves other modules, backs up updates', t => {
  const {root, source, target, module} = fixture(t);
  fs.mkdirSync(path.join(target, 'third-party'));
  fs.writeFileSync(path.join(target, 'third-party', 'keep.txt'), 'keep');
  assert.equal(validate(source).length, 1);
  assert.equal(plan(source, target).length, 1);
  assert.equal(install(source, target).length, 1);
  assert.equal(plan(source, target).length, 0);
  assert.equal(install(source, target).length, 0);
  fs.writeFileSync(path.join(module, 'main.mjs'), 'export const value = 2;');
  install(source, target);
  const backup = fs.readdirSync(path.join(root, 'data', 'module-backups'))[0];
  assert.equal(fs.readFileSync(path.join(root, 'data', 'module-backups', backup, 'main.mjs'), 'utf8'), 'export const value = 1;');
  assert.equal(fs.readFileSync(path.join(target, 'test-module', 'main.mjs'), 'utf8'), 'export const value = 2;');
  assert.equal(fs.readFileSync(path.join(target, 'third-party', 'keep.txt'), 'utf8'), 'keep');
});

test('invalid package fails before an installed module changes', t => {
  const {source, target, module} = fixture(t);
  install(source, target);
  fs.unlinkSync(path.join(module, 'main.mjs'));
  assert.throws(() => install(source, target), /Missing or invalid resource/);
  assert.equal(fs.readFileSync(path.join(target, 'test-module', 'main.mjs'), 'utf8'), 'export const value = 1;');
});

test('failed replacement restores previous installed package', t => {
  const {source, target, module} = fixture(t);
  install(source, target);
  fs.writeFileSync(path.join(module, 'main.mjs'), 'export const value = 2;');
  const rename = fs.renameSync;
  fs.renameSync = (from, to) => {
    if (path.basename(from).startsWith('.test-module-')) throw new Error('simulated rename failure');
    return rename(from, to);
  };
  try { assert.throws(() => install(source, target), /simulated/); }
  finally { fs.renameSync = rename; }
  assert.equal(fs.readFileSync(path.join(target, 'test-module', 'main.mjs'), 'utf8'), 'export const value = 1;');
  assert.deepEqual(fs.readdirSync(target), ['test-module']);
});
