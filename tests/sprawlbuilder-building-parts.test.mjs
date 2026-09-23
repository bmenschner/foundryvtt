import test from 'node:test';
import assert from 'node:assert/strict';
import {wallSelection,groupTransformUpdates,setInteriorView,buildingPartInvisible,setBuildingWall} from '../modules/shadowrun-sprawlbuilder/building-parts.mjs';
import {wallSide,roofOutline} from '../modules/shadowrun-sprawlbuilder/buildings.mjs';
import {editingClass} from '../modules/shadowrun-sprawlbuilder/tile-editing.mjs';
const ID='shadowrun-sprawlbuilder';
const part=(id,role,group='one')=>({id,x:10,y:20,width:500,height:400,rotation:0,hidden:false,alpha:1,flags:{[ID]:{buildingVersion:2,buildingGroup:group,buildingPart:role}}});

test('wall switches cover all outward directions including inset L edges',()=>{
  assert.deepEqual(wallSelection({north:false,west:false}),{north:false,south:true,west:false,east:true});
  const points=roofOutline(8,6,'l');assert.deepEqual(points.map((a,i)=>wallSide(a,points[(i+1)%points.length])),['north','east','north','east','south','west']);
});
test('group geometry propagates only to sibling parts and never copies roof height or visibility',()=>{
  const floor=part('floor','floor'),roof=part('roof','roof'),other=part('other','roof','two');floor.x=900;floor.width=1000;floor.rotation=90;
  const updates=groupTransformUpdates(floor,{x:900,width:1000,rotation:90},[floor,roof,other]);
  assert.deepEqual(updates,[{_id:'roof',x:900,y:20,width:1000,height:400,rotation:90}]);
  assert.deepEqual(groupTransformUpdates(floor,{alpha:0},[floor,roof]),[]);
});
test('interior mode is local to the GM and closes without document mutations',()=>{
  const scene={},roof=part('roof','roof'),floor=part('floor','floor'),other=part('other','roof','two');for(const doc of [roof,floor,other])doc.parent=scene;scene.tiles=[roof,floor,other];
  globalThis.game={user:{isGM:true}};const before=JSON.stringify(roof.flags);
  setInteriorView(scene,'one',true);assert.equal(buildingPartInvisible(roof),true);assert.equal(buildingPartInvisible(floor),false);assert.equal(buildingPartInvisible(other),false);
  class Base{constructor(document){this.document=document;}get isVisible(){return true;}get isInteractable(){return true;}}
  const Tile=editingClass(Base),object=new Tile(roof);assert.equal(object.isVisible,false);assert.equal(object.isInteractable,false);
  game.user.isGM=false;assert.equal(object.isVisible,true);game.user.isGM=true;
  setInteriorView(scene,'one',false);assert.equal(object.isVisible,true);assert.equal(roof.hidden,false);assert.equal(roof.alpha,1);assert.equal(JSON.stringify(roof.flags),before);
  delete globalThis.game;
});
test('wall visibility is persisted for its group only and rejects wrong scenes and locks',async()=>{
  const north=part('north','wall-north'),roof=part('roof','roof'),other=part('other','wall-north','two');let updates;
  const scene={tiles:[north,roof,other],async updateEmbeddedDocuments(type,data){updates=data;}};
  globalThis.game={user:{isGM:true},release:{generation:14}};globalThis.canvas={scene,ready:true};
  await setBuildingWall(scene,'one','north',false);assert.equal(updates.length,2);assert.equal(new Set(updates.map(d=>d._id)).size,2);assert.equal(updates[0].alpha,0);assert.equal(updates[0].hidden,true);assert.equal(updates[1].alpha,undefined);
  north.locked=true;await assert.rejects(()=>setBuildingWall(scene,'one','north',true),/gesperrt/);
  canvas.scene={};await assert.rejects(()=>setBuildingWall(scene,'one','north',true),/Szene/);
  delete globalThis.game;delete globalThis.canvas;
});
