import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {ID,filterAssets,tileData,assetPath,taxonomy,collections,assetTypes,registerCatalog,initializeCatalog,sceneControls,loadCatalog} from '../modules/shadowrun-sprawlbuilder/catalog.mjs';
import * as legacy from '../modules/assets-grimmes-erwachen/catalog.mjs';
import {stampCells} from '../modules/shadowrun-sprawlbuilder/stamps.mjs';
import {undoStroke,recordHistory} from '../modules/shadowrun-sprawlbuilder/brush.mjs';
import {dragEdge} from '../modules/shadowrun-sprawlbuilder/resize.mjs';
const root=`modules/${ID}`;
const catalog=JSON.parse(fs.readFileSync(`${root}/catalog.json`));
const icons=catalog.icons;
const originals=JSON.parse(fs.readFileSync('modules/assets-grimmes-erwachen/catalog.json')).icons;
const context={grid:{size:100,distance:1,units:'m'},rect:{x:200,y:300,width:2000,height:1000},level:{id:'ground',elevation:{bottom:0}}};

test('SprawlBuilder is standalone, complete and retains every original pixel and physical dimension',()=>{
  const manifest=JSON.parse(fs.readFileSync(`${root}/module.json`));
  assert.equal(manifest.id,ID);assert.equal(manifest.title,'Shadowrun SprawlBuilder');assert(!manifest.relationships);
  assert.equal(icons.length,282);assert.equal(new Set(icons.map(a=>a.key)).size,282);
  assert.deepEqual(icons.map(a=>a.key).sort(),originals.map(a=>a.key).sort());
  for(const a of icons){
    const old=originals.find(b=>a.key===b.key);
    assert(collections[a.collection]);assert(taxonomy[a.category]?.subcategories[a.subcategory]);assert(assetTypes[a.assetType]);
    for(const key of ['widthMeters','heightMeters','pixelWidth','pixelHeight','alphaBounds','sha256'])assert.deepEqual(a[key],old[key],`${a.key}: ${key}`);
    const bytes=fs.readFileSync(`${root}/${a.file}`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),old.sha256);
    assert(assetPath(a).startsWith(`modules/${ID}/`));
    const tile=tileData(a,context),before=legacy.tileData(old,context);
    assert.deepEqual([tile.x,tile.y,tile.width,tile.height],[before.x,before.y,before.width,before.height]);
    assert(tile.flags[ID]);assert(!tile.flags[legacy.ID]);
  }
});

test('semantic categories separate infrastructure, nature, floors, building pieces and small equipment',()=>{
  const expected={kanaldeckel:['strassen','kanalisation'],'gehweg-betonplatten':['strassen','gehwege'],teppich:['innenboeden','teppiche'],'gras-einfach':['natur','untergrund'],heckensegment:['natur','vegetation'],grundmauersegment:['gebaeude','waende'],mauerrest:['absperrungen','mauern'],'kuechenutensilien':['ausstattung','geschirr'],bartresen:['ausstattung','bar'],laborarbeitsplatte:['ausstattung','labor']};
  for(const [key,pair] of Object.entries(expected)){const a=icons.find(a=>a.key===key);assert.deepEqual([a.category,a.subcategory],pair);}
  assert.equal(icons.filter(a=>a.kind==='terrain').length,3);
  assert(icons.every(a=>a.collection==='grimmes-erwachen'));
});

test('search combines hierarchy, collection, type, umlauts and aliases without inventing missing materials',()=>{
  const keys=items=>items.map(a=>a.key);
  assert(keys(filterAssets(icons,'gully','strassen',{subcategory:'kanalisation'})).includes('kanaldeckel'));
  assert(keys(filterAssets(icons,'cafe stuhl','einrichtung',{subcategory:'sitzen'})).includes('cafe-stuhl-holz'));
  assert.deepEqual(keys(filterAssets(icons,'cafe holz','einrichtung',{subcategory:'sitzen'})),['cafe-stuhl-holz']);
  assert.deepEqual(keys(filterAssets(icons,'','natur',{assetType:'terrain',collection:'grimmes-erwachen'})),['gras-einfach']);
  assert.equal(filterAssets(icons,'','strassen',{subcategory:'labor'}).length,0);
  assert.equal(filterAssets(icons,'','natur',{collection:'unbekannt'}).length,0);
  assert.equal(filterAssets(icons,'Sandboden').length,0);
});

test('catalog rejects duplicate identities and broken taxonomy instead of rendering ambiguous items',async()=>{
  globalThis.fetch=async()=>({ok:true,json:async()=>catalog});
  assert.equal((await loadCatalog()).length,282);
  for(const broken of [[icons[0],icons[0]],[{...icons[0],subcategory:'missing'}],[{...icons[0],file:'../../private'}]]){
    globalThis.fetch=async()=>({ok:true,json:async()=>({icons:broken})});
    await assert.rejects(loadCatalog());
  }
});

test('old and new menus, APIs, launcher macros and scene controls coexist',async()=>{
  const menus=new Map(),macros=[];
  globalThis.foundry={applications:{api:{ApplicationV2:class {}}}};
  globalThis.game={user:{isGM:true,id:'gm'},users:{activeGM:{id:'gm'}},modules:new Map([[ID,{}],[legacy.ID,{}]]),settings:{registerMenu:(id,key,data)=>menus.set(id,data)},macros};
  globalThis.CONFIG={Macro:{documentClass:{create:async d=>macros.push({getFlag:(id,key)=>d.flags[id]?.[key]})}}};
  legacy.registerCatalog();registerCatalog();await legacy.initializeCatalog();await initializeCatalog();await initializeCatalog();
  assert.equal(menus.size,2);assert.equal(macros.length,2);
  assert.equal(typeof game.modules.get(ID).api.showBrush,'function');assert.equal(typeof game.modules.get(legacy.ID).api.showBrush,'function');
  const controls={};legacy.sceneControls(controls);sceneControls(controls);assert(controls[ID]);assert(controls[legacy.ID]);
  game.user.isGM=false;sceneControls(controls);assert.equal(controls[ID].visible,false);
});

test('one-metre stamping and edge resize retain scene origin and scale',()=>{
  const cells=stampCells([{x:215,y:325},{x:510,y:325}],100,context.rect);
  assert.deepEqual(cells.map(c=>[c.x,c.y]),[[200,300],[300,300],[400,300],[500,300]]);
  assert.deepEqual(dragEdge({x:200,y:300,width:300,height:200},'left',{x:100,y:300}),{x:100,y:300,width:400,height:200});
});

test('undo never removes legacy tiles and is scoped to the current scene and level',async()=>{
  const deleted=[],tiles=new Map([['new',{flags:{[ID]:{painted:true}}}],['old',{flags:{[legacy.ID]:{painted:true}}}]]);
  const scene={tiles,deleteEmbeddedDocuments:async(type,ids)=>deleted.push(...ids)};
  globalThis.game={user:{isGM:true},release:{generation:14}};
  globalThis.canvas={ready:true,scene,level:context.level};
  recordHistory({scene,levelId:'other',ids:['leave']});recordHistory({scene,levelId:'ground',ids:['new','old']});
  await undoStroke();assert.deepEqual(deleted,['new']);await assert.rejects(undoStroke(),/Kein eigener/);
});
