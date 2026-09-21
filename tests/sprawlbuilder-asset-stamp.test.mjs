import test from 'node:test';
import assert from 'node:assert/strict';
import {assetStampData,saveAssetStamp,saveRow,undoAssetStamp,undoRow} from '../modules/shadowrun-sprawlbuilder/rows.mjs';
const asset={key:'heckensegment',name:'Hecke',file:'assets/natur/heckensegment.webp',widthMeters:3,pixelWidth:400,pixelHeight:150,alphaBounds:[20,10,320,110]};
const grid={size:100,distance:1,units:'m'},rect={x:0,y:0,width:5000,height:5000},level={id:'ground'},point={x:1000,y:1000};
test('single stamp centres visible bounds at cursor and preserves proportions and size',()=>{
  const t=assetStampData(asset,{grid,rect,level,point});assert.equal(t.x-30,point.x);assert.equal(t.y-15,point.y);assert.equal(t.width,400);
  const scaled=assetStampData(asset,{grid,rect,level,point,widthMeters:1.5});assert.equal(scaled.width,200);assert.equal(scaled.height,75);
  assert.throws(()=>assetStampData(asset,{grid,rect,level,point:{x:0,y:0}}));
});
test('single placement undo is separate from rows and rejects interrupted async work',async()=>{
  const tiles=new Map();let serial=0;
  const scene={grid,tiles,async createEmbeddedDocuments(type,data){const docs=data.map(t=>({...t,id:String(++serial)}));for(const d of docs)tiles.set(d.id,d);return docs;},async deleteEmbeddedDocuments(type,ids){for(const id of ids)tiles.delete(id);}};
  globalThis.game={user:{isGM:true},release:{generation:14}};globalThis.canvas={ready:true,scene,level};globalThis.fetch=async()=>({ok:true});
  const args={scene,level,rect,point};await saveAssetStamp(asset,args);await saveAssetStamp(asset,args);await saveRow(asset,{...args,start:point,end:{x:1600,y:1000}});assert.equal(tiles.size,4);
  await undoAssetStamp();assert.equal(tiles.size,3);await undoRow();assert.equal(tiles.size,1);
  let cancelled=false;globalThis.fetch=async()=>{cancelled=true;return{ok:true};};await assert.rejects(saveAssetStamp(asset,{...args,cancelled:()=>cancelled}));assert.equal(tiles.size,1);
  globalThis.fetch=async()=>{canvas.level={id:'upper'};return{ok:true};};await assert.rejects(saveAssetStamp(asset,args));assert.equal(tiles.size,1);
});
