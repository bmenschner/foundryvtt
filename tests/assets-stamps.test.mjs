import test from 'node:test';
import assert from 'node:assert/strict';
import {stampCells,saveStamps} from '../modules/assets-grimmes-erwachen/stamps.mjs';
import {recordHistory,undoStroke} from '../modules/assets-grimmes-erwachen/brush.mjs';
import {ID} from '../modules/assets-grimmes-erwachen/catalog.mjs';
const rect={x:50,y:70,width:1000,height:800};
function storageFixture(world){
  const made=[],uploads=[],documents=new Map();
  const scene={tiles:{get:id=>documents.get(id),[Symbol.iterator]:()=>documents.values()},async createEmbeddedDocuments(type,items){made.push(items);return items.map((item,i)=>{const t={...item,id:`tile-${documents.size}`};documents.set(t.id,t);return t;});},async deleteEmbeddedDocuments(type,ids){ids.forEach(id=>documents.delete(id));}};
  const level={id:'ground',elevation:{bottom:2}};
  globalThis.game={user:{isGM:true},release:{generation:14},world:{id:world}};globalThis.canvas={ready:true,scene,level};
  globalThis.DOMMatrix=class{scale(){return this;}};
  globalThis.document={createElement:()=>({getContext:()=>({setTransform(){},createPattern:()=>({setTransform(){}}),fillRect(){}}),toBlob:cb=>cb(new Blob(['png']))})};
  const picker={browse:async()=>({}),upload:async(source,path,file)=>{uploads.push(file);return {path:`${path}/${file.name}`};}};
  globalThis.foundry={applications:{apps:{FilePicker:{implementation:picker}}}};
  const asset={key:'test',sha256:'abc',name:'Test',widthMeters:4,heightMeters:4};
  return {made,uploads,documents,picker,scene,level,args:{scene,level,asset,cells:stampCells([{x:50,y:50},{x:450,y:50}],100,{x:0,y:0,width:1000,height:1000}),ppm:100,image:{width:400,height:400}}};
}
test('stamp upload reuses matching texture phases and creates one batch with grouped undo',async()=>{
  const f=storageFixture('stamp-success');await saveStamps(f.args);
  assert.equal(f.uploads.length,4);assert.equal(f.made.length,1);assert.equal(f.made[0].length,5);
  assert.equal(new Set(f.made[0].map(t=>t.flags[ID].group)).size,1);
  assert.equal(f.made[0][0].texture.src,f.made[0][4].texture.src);
  for(const t of f.made[0]){assert.equal(t.width,100);assert.equal(t.height,100);assert.equal(t.texture.anchorX,0);assert.equal(t.texture.anchorY,0);assert.equal(t.anchorX,undefined);assert.deepEqual(t.levels,['ground']);}
  await undoStroke();assert.equal(f.documents.size,0);
  await saveStamps(f.args);assert.equal(f.uploads.length,4);
});
test('failed upload and scene/level changes create no partial stamp documents',async()=>{
  for(const mode of ['upload','scene','level']){
    const f=storageFixture(`stamp-failure-${mode}`);let calls=0;
    f.picker.upload=async()=>{if(++calls===2){if(mode==='upload')return {error:'Upload gescheitert'};if(mode==='scene')canvas.scene={};else canvas.level={id:'different'};}return {path:`worlds/stamp-${mode}/${calls}.png`};};
    await assert.rejects(saveStamps(f.args));assert.equal(f.made.length,0);assert.equal(f.documents.size,0);
  }
});
test('click snaps to a metre cell relative to the scene origin',()=>{
  assert.deepEqual(stampCells([{x:175,y:190}],100,rect),[{x:150,y:170,width:100,height:100}]);
  assert.deepEqual(stampCells([{x:49,y:70}],100,rect),[]);
  assert.deepEqual(stampCells([{x:1049,y:869}],100,rect),[{x:950,y:770,width:100,height:100}]);
  assert.deepEqual(stampCells([{x:1050,y:870}],100,rect),[]);
});
test('drag interpolates the actual diagonal path, connects neighbours and deduplicates revisits',()=>{
  const cells=stampCells([{x:60,y:80},{x:460,y:480},{x:60,y:80}],100,rect);
  assert.equal(new Set(cells.map(c=>`${c.x},${c.y}`)).size,cells.length);
  assert(cells.some(c=>c.x===250&&c.y===270));assert(cells.some(c=>c.x===450&&c.y===470));
  assert(!cells.some(c=>c.x===450&&c.y===70));
  assert.equal(stampCells([{x:60,y:80},{x:460,y:80},{x:60,y:80}],100,rect).length,5);
  assert.throws(()=>stampCells([{x:60,y:80},{x:660,y:80}],100,rect,3));
  assert.throws(()=>stampCells([{x:NaN,y:0}],100,rect));
  assert.throws(()=>stampCells([{x:0,y:0}],0,rect));
});
test('undo removes one entire stamp gesture while preserving unrelated tiles',async()=>{
  const documents=new Map(['a','b','other'].map(id=>[id,{flags:{[ID]:{painted:true}}}]));let deleted;
  const scene={tiles:documents,deleteEmbeddedDocuments:async(type,ids)=>{deleted=ids;}};
  globalThis.game={user:{isGM:true},release:{generation:14}};
  globalThis.canvas={ready:true,scene,level:{id:'ground'}};
  recordHistory({scene,levelId:'ground',ids:['a','b']});await undoStroke();assert.deepEqual(deleted,['a','b']);
  game.user.isGM=false;await assert.rejects(saveStamps({scene,level:canvas.level}),/Berechtigung/);
});
