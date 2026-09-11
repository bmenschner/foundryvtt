import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root='modules/grimmes-erwachen/assets/rendered-v2';
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
test('rendered pack contains all promised distinct transparent icons and map files',()=>{
  const data=JSON.parse(fs.readFileSync(`${root}/Bibliotheken.json`,'utf8'));
  assert.equal(data.complete,true);assert.deepEqual(data.missing,[]);
  assert.equal(data.icons.length,277);assert.equal(data.maps.length,32);
  assert.equal(new Set(data.icons.map(i=>i.category)).size,8);
  assert.equal(new Set(data.icons.map(i=>i.sha256)).size,277);
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

test('Alchera detail map is calibrated to a five metre ring',()=>{
  const data=JSON.parse(fs.readFileSync(`${root}/Bibliotheken.json`,'utf8'));
  const map=data.maps.find(m=>m.key==='a3-08-alchera');
  const calibration=JSON.parse(fs.readFileSync(`${root}/${map.calibrationFile}`,'utf8'));
  const {width,height}=map.sceneDimensions;
  assert.equal(width,Math.round(map.widthMeters*100));assert.equal(height,Math.round(map.heightMeters*100));
  assert.equal(width,calibration.foundry.width);assert.equal(height,calibration.foundry.height);
  assert.equal(calibration.foundry.grid.distance,1);assert.equal(calibration.foundry.grid.units,'m');
  const ringMeters=calibration.calibration.measuredDiameterPixels*width/map.pixelWidth/100;
  assert(Math.abs(ringMeters-5)<0.01);
  const png=fs.readFileSync(`${root}/${map.file}`);
  assert.equal(png.readUInt32BE(16),map.pixelWidth);assert.equal(png.readUInt32BE(20),map.pixelHeight);
});
test('research gaps and additional variants all resolve to generated icon files',()=>{
  const read=name=>JSON.parse(fs.readFileSync(`${root}/${name}.json`,'utf8'));
  const mapping=read('Recherche-Icon-Zuordnung');
  const report=read('Erweiterung-Pruefstand');
  const additions=read('Erweiterung-Auftraege');
  const icons=new Map(read('Bibliotheken').icons.map(i=>[i.key,i]));
  assert.equal(additions.length,196);
  assert.equal(report.allPlannedFilesPresent,true);
  assert.equal(report.filesMissing,0);
  assert.equal(report.requirementsFullyGenerated,mapping.requirements.length);
  assert.deepEqual(report.additionalVariantsMissing,[]);
  const keys=new Set([...mapping.requirements.flatMap(r=>r.iconKeys),...mapping.additionalVariants]);
  for(const added of additions) assert(keys.has(added.key),added.key);
  for(const key of keys) {
    assert(icons.has(key),key);
    assert(fs.existsSync(`${root}/${icons.get(key).file}`),key);
  }
});
