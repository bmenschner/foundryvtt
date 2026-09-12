import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {ID,filterAssets,tileData,assetPath,placeAsset,registerCatalog,initializeCatalog} from '../modules/assets-grimmes-erwachen/catalog.mjs';
const root=`modules/${ID}`;
const asset={key:'stuhl',name:'Café-Stuhl',category:'gastronomie',file:'assets/gastronomie/stuhl.webp',pixelWidth:1000,pixelHeight:800,alphaBounds:[100,200,900,600],widthMeters:2};
const context={grid:{size:100,distance:1,units:'m'},rect:{x:500,y:300,width:4000,height:3000},level:{id:'upper',elevation:{bottom:10}}};

test('standalone pack contains every generated element, without adventure dependency',()=>{
  const manifest=JSON.parse(fs.readFileSync(`${root}/module.json`));assert.equal(manifest.title,'Assets - Grimmes Erwachen');assert(!manifest.relationships);
  const icons=JSON.parse(fs.readFileSync(`${root}/catalog.json`)).icons;
  const originals=JSON.parse(fs.readFileSync('modules/grimmes-erwachen/assets/rendered-v2/Bibliotheken.json')).icons;
  assert.equal(icons.length,282);assert.equal(new Set(icons.map(a=>a.category)).size,10);
  assert.deepEqual(icons.filter(a=>!a.generation).map(a=>a.key).sort(),originals.map(a=>a.key).sort());
  for(const icon of icons){
    const data=fs.readFileSync(`${root}/${icon.file}`);
    assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'),icon.sha256);
    if(!icon.generation) assert.equal(icon.sourceSha256,originals.find(a=>a.key===icon.key).sha256);
    if(!icon.generation) assert.deepEqual(icon.alphaBounds,originals.find(a=>a.key===icon.key).alphaBounds);
    assert.equal(icon.rgbaSha256.length,64);
  }
  const report=JSON.parse(fs.readFileSync(`${root}/conversion-report.json`));
  assert.equal(report.count,277);assert.equal(report.allPixelsIdentical,true);assert(report.assetBytes<report.sourceBytes);
});
test('search combines words and category, including umlauts',()=>{
  assert.equal(filterAssets([asset],'cafe stuhl','gastronomie').length,1);
  assert.equal(filterAssets([asset],'stuhl','sport').length,0);
  assert.equal(filterAssets([asset],'unbekannt').length,0);
});
test('terrain tiles occupy their specified metre footprint without transparent margins',()=>{
  const terrain=JSON.parse(fs.readFileSync(`${root}/catalog.json`)).icons.filter(a=>a.kind==='terrain');
  assert.equal(terrain.length,3);
  for(const a of terrain){
    assert.deepEqual(a.alphaBounds,[0,0,a.pixelWidth,a.pixelHeight]);
    assert.deepEqual(a.alphaExtrema,[255,255]);
    const tile=tileData(a,context);
    assert.equal(tile.width,a.widthMeters*100);
    assert.equal(tile.height,a.heightMeters*100);
    assert.equal(filterAssets(terrain,a.name,a.category).length,1);
  }
});
test('tile scale excludes transparent margins and centres visible bounds on the selected level',()=>{
  const tile=tileData(asset,context);
  assert.equal(tile.width,250);assert.equal(tile.height,200);
  assert.equal(tile.x+(100+900)/2*0.25,2500);assert.equal(tile.y+(200+600)/2*0.25,1800);
  assert.equal((900-100)*tile.width/1000,200);
  assert.equal(tile.elevation,10);assert.deepEqual(tile.levels,['upper']);
  assert.equal(tileData(asset,{...context,grid:{size:80,distance:2,units:'m'}}).width,100);
  assert(Math.abs(tileData(asset,{...context,grid:{size:100,distance:5,units:'ft'}}).width-250/1.524)<1e-9);
  assert.throws(()=>tileData(asset,context,0));assert.throws(()=>tileData(asset,context,NaN));
  assert.throws(()=>tileData(asset,{...context,grid:{size:100,distance:1,units:'unknown'}}));
  assert.throws(()=>tileData({...asset,alphaBounds:[0,0,0,0]},context));
  assert.throws(()=>assetPath({...asset,file:'../../worlds/private'}));
});
test('placement checks GM, file and scene changes before creating a tile',async()=>{
  const made=[];
  globalThis.game={user:{isGM:false},release:{generation:14}};
  globalThis.ui={notifications:{info(){}}};
  globalThis.canvas={ready:true,scene:{grid:context.grid,createEmbeddedDocuments:async(type,data)=>{made.push({type,data});return [{}];}},level:context.level,dimensions:{sceneRect:context.rect}};
  await assert.rejects(placeAsset(asset),/Spielleitung/);
  game.user.isGM=true;globalThis.fetch=async()=>({ok:false});await assert.rejects(placeAsset(asset),/Bilddatei fehlt/);assert.equal(made.length,0);
  globalThis.fetch=async()=>{canvas.level={id:'other'};return {ok:true};};await assert.rejects(placeAsset(asset),/gewechselt/);assert.equal(made.length,0);
  canvas.level=context.level;globalThis.fetch=async()=>({ok:true});await placeAsset(asset,3);
  assert.equal(made.length,1);assert.equal(made[0].type,'Tile');assert.equal(made[0].data[0].width,375);
});
test('catalog menu and launcher work with only the standalone module enabled',async()=>{
  let menu,created=0;const macros=[];
  globalThis.foundry={applications:{api:{ApplicationV2:class {}}}};
  globalThis.game={user:{isGM:true,id:'gm'},users:{activeGM:{id:'gm'}},modules:new Map([[ID,{}]]),settings:{registerMenu:(id,key,data)=>menu=data},macros};
  globalThis.CONFIG={Macro:{documentClass:{create:async d=>{created++;macros.push({getFlag:(id,key)=>d.flags[id][key]});}}}};
  registerCatalog();assert(menu.restricted);assert.equal(menu.label,'Bilderkatalog öffnen');
  await initializeCatalog();await initializeCatalog();assert.equal(created,1);assert.equal(typeof game.modules.get(ID).api.showCatalog,'function');
});
