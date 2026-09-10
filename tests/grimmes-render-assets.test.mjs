import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root='modules/grimmes-erwachen/assets/rendered-v2';
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
test('rendered pack contains all promised distinct transparent icons and map files',()=>{
  const data=JSON.parse(fs.readFileSync(`${root}/Bibliotheken.json`,'utf8'));
  assert.equal(data.complete,true);assert.deepEqual(data.missing,[]);
  assert.equal(data.icons.length,81);assert.equal(data.maps.length,31);
  assert.equal(new Set(data.icons.map(i=>i.category)).size,7);
  assert.equal(new Set(data.icons.map(i=>i.sha256)).size,81);
  for(const asset of [...data.icons,...data.maps]) {
    assert.equal(hash(fs.readFileSync(`${root}/${asset.file}`)),asset.sha256,asset.file);
    assert(asset.widthMeters>0 && asset.heightMeters>0);
  }
  for(const icon of data.icons) {
    assert.equal(icon.alphaExtrema[0],0,icon.file);
    assert(icon.alphaExtrema[1]>=250,icon.file);
    assert.equal(fs.readFileSync(`${root}/${icon.file}`)[25],6,`${icon.file}: RGBA PNG`);
  }
  assert.equal(hash(fs.readFileSync(`${root}/karten/a3-08-alchera.webp`)),hash(fs.readFileSync('modules/grimmes-erwachen/assets/maps/a3-08-alchera.webp')));
});
