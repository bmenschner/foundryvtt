import test from 'node:test';
import assert from 'node:assert/strict';
import {snapToEdges} from '../modules/shadowrun-sprawlbuilder/snapping.mjs';
import {editingClass,styleTile,transformTile,resizeCorner} from '../modules/shadowrun-sprawlbuilder/tile-editing.mjs';
const ID='shadowrun-sprawlbuilder',near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const targets=[{id:'walk',x:600,y:600,width:400,height:600,rotation:0},{id:'curb',x:390,y:450,width:20,height:100,rotation:0}];
test('curb contacts right pavement and upper curb simultaneously, retaining primary constraint',()=>{
  const r=snapToEdges({point:{x:383,y:557},width:20,height:100,targets,previous:'walk:2'});
  near(r.point.x,390);near(r.point.y,550);assert.equal(r.match.key,'walk:2');assert.equal(r.match.secondary.targetId,'curb');
  const released=snapToEdges({point:{x:365,y:580},width:20,height:100,targets,previous:'walk:2'});assert.equal(released.match,null);
});
test('incompatible parallel constraints cannot move the primary edge',()=>{
  const r=snapToEdges({point:{x:383,y:557},width:20,height:100,targets:[targets[0],{...targets[0],id:'other',x:595}],previous:'walk:2'});near(r.point.x,390);assert(!r.match.secondary);
});
function doc(data={}){const d={id:'mine',x:383,y:557,width:20,height:100,rotation:0,texture:{anchorX:.5,anchorY:.5},levels:['ground'],flags:{[ID]:{}},...data};d.toObject=()=>Object.fromEntries(Object.entries(d).filter(([k,v])=>k!=='parent'&&typeof v!=='function'));d.updateSource=u=>Object.assign(d,u);return d;}
test('pixel scaling retains visible centre and free corner holds opposite corner',()=>{
  const d=doc();const u=transformTile(d,{width:21,height:105});near(u.x,d.x);near(u.y,d.y);assert.equal(u.width,21);
  const r=resizeCorner(d,{x:413,y:632},false);near(r.x-r.width/2,d.x-d.width/2);near(r.y-r.height/2,d.y-d.height/2);
  assert.throws(()=>transformTile(d,{width:0,height:1}));
});
test('native preview/drop use two edges; Alt, multiple selection and foreign tiles delegate safely',()=>{
  globalThis.game={user:{isGM:true}};const d=doc(),walk=doc({id:'walk',x:600,y:600,width:400,height:600}),curb=doc({id:'curb',x:390,y:450,width:20,height:100});
  const scene={tiles:new Map([[d.id,d],['walk',walk],['curb',curb]])};scene.tiles[Symbol.iterator]=scene.tiles.values.bind(scene.tiles);d.parent=scene;
  globalThis.canvas={ready:true,scene,level:{id:'ground'},tiles:{controlled:[]},clientCoordinatesFromCanvas:p=>p};
  globalThis.document={createElement:()=>({getContext:()=>({beginPath(){},moveTo(){},lineTo(){},stroke(){}}),remove(){}}),body:{append(){}}};globalThis.innerWidth=1000;globalThis.innerHeight=1000;
  class Base{constructor(){this.document=d;this.layer={preview:{children:[]}};}getSnappedPosition(){return{x:0,y:0};}_refreshState(){}_applyRenderFlags(){}_updateDragPreviews(){}_prepareDragLeftDropUpdates(e){return [{_id:d.id,...e.update}];}_onDragLeftCancel(){return 'cancel';}_onDragLeftDrop(){return 'drop';}}
  const Tile=editingClass(Base),tile=new Tile();canvas.tiles.controlled=[tile];
  const preview={_original:tile,document:doc(),renderFlags:{set(){}},isPreview:true};tile.layer.preview.children=[preview];
  tile._updateDragPreviews({});near(preview.document.x,390);near(preview.document.y,550);
  const update=tile._prepareDragLeftDropUpdates({update:{x:383,y:557}})[0];near(update.x,390);near(update.y,550);
  near(tile._prepareDragLeftDropUpdates({update:{x:383,y:557},altKey:true})[0].x,383);
  canvas.tiles.controlled=[tile,{}];near(tile._prepareDragLeftDropUpdates({update:{x:383,y:557}})[0].x,383);
  canvas.tiles.controlled=[tile];d.flags={};near(tile._prepareDragLeftDropUpdates({update:{x:383,y:557}})[0].x,383);assert.deepEqual(tile.getSnappedPosition({x:383,y:557}),{x:0,y:0});
});
test('selection frame replacement is scoped and restored on release',()=>{
  globalThis.game={user:{isGM:true}};const part={renderable:true,eventMode:'static'},object={document:doc(),controlled:true,frame:part};styleTile(object);assert.equal(part.renderable,false);assert.equal(part.eventMode,'none');object.controlled=false;styleTile(object);assert.equal(part.renderable,true);assert.equal(part.eventMode,'static');
  object.document.flags={};object.controlled=true;styleTile(object);assert.equal(part.renderable,true);
});
