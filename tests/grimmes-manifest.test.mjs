import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Eden 4.0.8 is not blocked by a major-only dependency maximum',()=>{
  const manifest=JSON.parse(fs.readFileSync('modules/grimmes-erwachen/module.json','utf8'));
  const system=manifest.relationships.systems.find(s=>s.id==='shadowrun6-eden');
  assert(system);
  assert.equal(system.compatibility.minimum,'4.0.8');
  // Foundry expands core-generation limits, but dependency maxima are exact
  // version comparisons: "4" means 4.0.0, not all releases of Eden 4.x.
  assert.equal(system.compatibility.maximum,undefined);
  const importer=fs.readFileSync('modules/grimmes-erwachen/importer.mjs','utf8');
  assert(importer.includes("Number(game.system.version.split('.')[0]) !== 4"));
  assert(importer.includes('CONFIG.Actor.dataModels?.host'));
});
