import test from 'node:test';
import assert from 'node:assert/strict';
import {stampCells,saveStamps} from '../modules/assets-grimmes-erwachen/stamps.mjs';
import {recordHistory,undoStroke} from '../modules/assets-grimmes-erwachen/brush.mjs';
import {ID} from '../modules/assets-grimmes-erwachen/catalog.mjs';
const rect={x:50,y:70,width:1000,height:800};
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
