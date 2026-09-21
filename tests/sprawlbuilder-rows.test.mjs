import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rowData,saveRow,undoRow} from '../modules/shadowrun-sprawlbuilder/rows.mjs';
import {ID} from '../modules/shadowrun-sprawlbuilder/catalog.mjs';
const asset={key:'heckensegment',name:'Hecke',file:'assets/natur/heckensegment.webp',widthMeters:3,pixelWidth:400,pixelHeight:150,alphaBounds:[20,10,320,110]};
const rect={x:0,y:0,width:5000,height:5000},level={id:'ground',elevation:{bottom:5}},grid={size:100,distance:1,units:'m'},start={x:2000,y:2000};
const options={grid,rect,level,start};
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('rows preserve alpha spacing and scale in every direction',()=>{
  for(const degrees of [0,45,90,135,180,225,270,315]){
    const angle=degrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),r=rowData(asset,{...options,end:{x:start.x+c*600,y:start.y+s*600}});
    assert.equal(r.count,2);near(r.lengthMeters,6);
    for(let i=0;i<2;i++){
      const t=r.data[i];near(t.width,400);near(t.height,150);near(t.rotation,degrees);
      // Visible center = image center + rotated alpha-center offset (-30,-15).
      const x=t.x-30*c+15*s,y=t.y-30*s-15*c;
      near(x,start.x+(i+.5)*300*c);near(y,start.y+(i+.5)*300*s);
      assert.equal(t.texture.anchorX,.5);assert.deepEqual(t.levels,['ground']);
    }
  }
});
test('rows use whole segments, honour units and reject invalid bounds/counts',()=>{
  assert.equal(rowData(asset,{...options,end:start}).count,1);
  assert.equal(rowData(asset,{...options,end:{x:2301,y:2000}}).count,2);
  const r=rowData(asset,{...options,grid:{size:100,distance:5,units:'ft'},end:{x:2300,y:2000}});near(r.data[0].width,400/1.524);
  assert.throws(()=>rowData(asset,{...options,end:{x:99999,y:2000}}),/128/);
  assert.throws(()=>rowData(asset,{...options,start:{x:4990,y:2000},end:{x:4991,y:2000}}),/innerhalb/);
  assert.throws(()=>rowData(asset,{...options,end:{x:NaN,y:0}}));
  assert.equal(rowData({...asset,key:'stuhl'},{...options,end:start}).count,1);
});
test('save and undo affect only this row and level; async context changes prevent creation',async()=>{
  const tiles=new Map([['foreign',{flags:{}}]]);let serial=0;
  const scene={grid,tiles,async createEmbeddedDocuments(type,data){const docs=data.map(t=>({...t,id:String(++serial)}));for(const d of docs)tiles.set(d.id,d);return docs;},async deleteEmbeddedDocuments(type,ids){for(const id of ids)tiles.delete(id);}};
  globalThis.game={user:{isGM:true},release:{generation:14}};globalThis.canvas={ready:true,scene,level};
  globalThis.fetch=async()=>({ok:true});
  const args={scene,level,rect,start,end:{x:2600,y:2000}};
  const created=await saveRow(asset,args);assert.equal(created.length,2);assert.equal(tiles.size,3);assert(created[0].flags[ID].rowGroup);assert(!created[0].flags[ID].painted);
  canvas.level={id:'other'};await assert.rejects(undoRow());assert.equal(tiles.size,3);canvas.level=level;
  await undoRow();assert.equal(tiles.size,1);assert(tiles.has('foreign'));
  globalThis.fetch=async()=>{canvas.level={id:'other'};return{ok:true};};await assert.rejects(saveRow(asset,args));assert.equal(tiles.size,1);
  canvas.level=level;globalThis.fetch=async()=>({ok:false});await assert.rejects(saveRow(asset,args));
  globalThis.fetch=async()=>({ok:true});await assert.rejects(saveRow(asset,{...args,cancelled:()=>true}));
  game.user.isGM=false;await assert.rejects(saveRow(asset,args));assert.equal(tiles.size,1);
});

test('every catalogue asset supports rows without category or key restrictions',()=>{
  const assets=JSON.parse(fs.readFileSync('modules/shadowrun-sprawlbuilder/catalog.json')).icons;
  for(const item of assets){const r=rowData(item,{...options,rect:{x:-1e6,y:-1e6,width:2e6,height:2e6},end:start});assert.equal(r.count,1,item.key);}
});
