import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {tileData,taxonomy,collections} from '../modules/shadowrun-sprawlbuilder/catalog.mjs';
const root='modules/shadowrun-sprawlbuilder';
test('100 distinct generated grounds are catalogued at four metres and preserve legacy assets',()=>{
  const icons=JSON.parse(fs.readFileSync(`${root}/catalog.json`)).icons;
  const grounds=icons.filter(a=>a.collection==='sprawlbuilder-boeden');
  assert.equal(grounds.length,100);
  assert.equal(new Set(grounds.map(a=>a.sourceSha256)).size,100);
  assert.equal(new Set(grounds.map(a=>a.sha256)).size,100);
  assert.equal(new Set(grounds.map(a=>a.material)).size,10);
  for(const a of grounds){
    assert(collections[a.collection]);assert(taxonomy[a.category].subcategories[a.subcategory]);
    assert.equal(a.kind,'terrain');assert.equal(a.assetType,'terrain');
    assert.equal(a.widthMeters,4);assert.equal(a.heightMeters,4);assert.equal(a.pixelWidth,a.pixelHeight);assert(a.pixelWidth>=1024);
    assert.deepEqual(a.alphaBounds,[0,0,a.pixelWidth,a.pixelHeight]);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(`${root}/${a.file}`)).digest('hex'),a.sha256);
    const tile=tileData(a,{grid:{size:100,distance:1,units:'m'},rect:{x:0,y:0,width:2000,height:2000}},1);
    assert.equal(tile.width,100);assert.equal(tile.height,100);
  }
});
