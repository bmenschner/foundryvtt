import test from 'node:test';
import assert from 'node:assert/strict';
import {squareCells} from '../modules/assets-grimmes-erwachen/brush.mjs';
import {dragEdge,tileBounds} from '../modules/assets-grimmes-erwachen/resize.mjs';
import {sceneControls,ID,tileData} from '../modules/assets-grimmes-erwachen/catalog.mjs';
test('square brush begins at pointer, fills skipped cells and joins turns by edges',()=>{
  const cells=squareCells([{x:120,y:160},{x:420,y:360}],100);
  assert.deepEqual(cells[0],{x:120,y:160,width:100,height:100});assert.equal(cells.length,6);
  for(let i=1;i<cells.length;i++)assert.equal(Math.abs(cells[i].x-cells[i-1].x)+Math.abs(cells[i].y-cells[i-1].y),100);
});
test('four edge handles keep the opposite edge fixed with legacy and explicit anchors',()=>{
  const b={x:100,y:200,width:300,height:400};
  assert.deepEqual(tileBounds({...b,anchorX:0,anchorY:0}),b);
  assert.deepEqual(tileBounds({...b,anchorX:0.5,anchorY:0.5}),{x:-50,y:0,width:300,height:400});
  assert.deepEqual(dragEdge(b,'left',{x:50,y:0}),{x:50,y:200,width:350,height:400});
  assert.deepEqual(dragEdge(b,'right',{x:500,y:0}),{x:100,y:200,width:400,height:400});
  assert.deepEqual(dragEdge(b,'top',{x:0,y:100}),{x:100,y:100,width:300,height:500});
  assert.deepEqual(dragEdge(b,'bottom',{x:0,y:700}),{x:100,y:200,width:300,height:500});
  assert.equal(dragEdge(b,'left',{x:800},25).width,25);
});
test('catalog has an independent GM navigation control and explicit tile anchor',()=>{
  globalThis.game={user:{isGM:true}};const controls={tokens:{}};sceneControls(controls);
  assert(controls[ID].visible);assert(controls[ID].tools.catalog.button);assert(controls[ID].tools.brush.button);assert(controls.tokens);
  game.user.isGM=false;sceneControls(controls);assert.equal(controls[ID].visible,false);
  const tile=tileData({name:'Test',key:'test',file:'assets/boden/test.webp',widthMeters:1,pixelWidth:100,pixelHeight:100,alphaBounds:[0,0,100,100]}, {grid:{size:100,distance:1,units:'m'},rect:{x:0,y:0,width:1000,height:1000}});
  assert.equal(tile.anchorX,0);assert.equal(tile.anchorY,0);assert.equal(tile.x,450);assert.equal(tile.y,450);
});
