import test from 'node:test';
import assert from 'node:assert/strict';
import {intersections,eraseCandidates} from '../modules/shadowrun-sprawlbuilder/erase.mjs';
import {ID} from '../modules/shadowrun-sprawlbuilder/catalog.mjs';

test('eraser clips cuts to the selected area without including adjacent tiles',()=>{
  assert.deepEqual(intersections({x:50,y:70,width:300,height:200},[{x:150,y:170,width:100,height:100},{x:350,y:70,width:100,height:100}]),[{x:150,y:170,width:100,height:100}]);
  assert.deepEqual(intersections({x:50,y:70,width:300,height:200},[{x:0,y:0,width:100,height:100}]),[{x:50,y:70,width:50,height:30}]);
});
test('eraser preserves other modules, levels, objects, locked and rotated floors',()=>{
  const base={x:50,y:70,width:300,height:200,texture:{anchorX:0,anchorY:0},flags:{[ID]:{painted:true}},levels:['ground']};
  const tiles=[base,{...base,levels:['upper']},{...base,flags:{'assets-grimmes-erwachen':{painted:true}}},{...base,flags:{}},{...base,locked:true},{...base,rotation:45}];
  const result=eraseCandidates(tiles,'ground',[{x:50,y:70,width:100,height:100}]);
  assert.equal(result.candidates.length,1);assert.equal(result.skipped.length,2);
});
test('eraser respects center anchors and fractional scene scales',()=>{
  const tile={x:150,y:170,width:200,height:200,texture:{anchorX:.5,anchorY:.5},flags:{[ID]:{painted:true}},levels:new Set(['ground'])};
  const result=eraseCandidates([tile],'ground',[{x:50,y:70,width:100/1.524,height:100/1.524}]);
  assert.equal(result.candidates[0].cuts[0].x,50);assert.equal(result.candidates[0].cuts[0].width,100/1.524);
});
