import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {snapToEdges} from '../modules/shadowrun-sprawlbuilder/snapping.mjs';
import {editingClass,styleTile,transformTile,selectionGeometry} from '../modules/shadowrun-sprawlbuilder/tile-editing.mjs';
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
test('pixel scaling retains visible centre',()=>{
  const d=doc();const u=transformTile(d,{width:21,height:105});near(u.x,d.x);near(u.y,d.y);assert.equal(u.width,21);
  assert.throws(()=>transformTile(d,{width:0,height:1}));
});
// Contract fixture follows V14 ShapeObjectMixin: shape snapping happens before
// clone updates and bypasses PlaceableObject.getSnappedPosition entirely.
// Optional local vendor source executes those actual three methods without
// redistributing Foundry code or relying on it for the standard test suite.
class NativeDrag {
  _onDragLeftMove(event){
    const d=event.interactionData;
    d.shape.move({x:d.destination.x-d.offset.x,y:d.destination.y-d.offset.y},{snap:!event.shiftKey});
    this._updateDragPreviews(event);
  }
  _updateDragPreviews(event){
    const {clones,origin,shape,offset}=event.interactionData;
    for(const clone of clones){const d=clone._original.document;clone.document.updateSource({x:d.x+shape.origin.x-origin.x+offset.x,y:d.y+shape.origin.y-origin.y+offset.y});}
  }
  _prepareDragLeftDropUpdates(event){return event.interactionData.clones.map(c=>({_id:c._original.id,x:c.document.x,y:c.document.y}));}
  getSnappedPosition(){throw new Error('V14 shape movement must not use this method');}
  _onDragLeftCancel(){return 'cancel';}
  _onDragLeftDrop(event){return this._prepareDragLeftDropUpdates(event);}
}
const bases=[['V14 shape contract',NativeDrag]];
if(process.env.FOUNDRY_CLIENT_SOURCE){
  const source=fs.readFileSync(process.env.FOUNDRY_CLIENT_SOURCE,'utf8');
  const mixin=source.slice(source.indexOf('function ShapeObjectMixin(Base) {'));
  const methods=['_onDragLeftMove','_updateDragPreviews','_prepareDragLeftDropUpdates'].map(name=>{
    const start=mixin.indexOf(`    ${name}(event) {`);assert(start>=0);
    const end=mixin.indexOf('\n    }',start);assert(end>start);
    return mixin.slice(start,end+6);
  });
  bases.push(['actual vendor ShapeObjectMixin methods',new Function('Base',`return class extends Base {${methods.join('\n')}}`)(NativeDrag)]);
}
for(const [name,Base] of bases)test(`${name}: native move/drop bypass grid before two-edge snapping`,()=>{
  globalThis.game={user:{isGM:true}};const d=doc({x:150,y:250}),walk=doc({id:'walk',x:600,y:600,width:400,height:600}),curb=doc({id:'curb',x:390,y:450,width:20,height:100});
  const scene={tiles:new Map([[d.id,d],['walk',walk],['curb',curb]])};scene.tiles[Symbol.iterator]=scene.tiles.values.bind(scene.tiles);d.parent=scene;d.schema=new Set(['x','y']);
  globalThis.canvas={ready:true,scene,level:{id:'ground'},tiles:{controlled:[]},clientCoordinatesFromCanvas:p=>p,_onDragCanvasPan(){}};
  globalThis.document={createElement:()=>({getContext:()=>({beginPath(){},moveTo(){},lineTo(){},stroke(){}}),remove(){}}),body:{append(){}}};globalThis.innerWidth=1000;globalThis.innerHeight=1000;
  const Tile=editingClass(Base),tile=new Tile();tile.document=d;tile.id=d.id;canvas.tiles.controlled=[tile];
  const preview={_original:tile,document:doc({id:null}),renderFlags:{set(){}},isPreview:true};
  const event={interactionData:{clones:[preview],origin:{x:155,y:258},offset:{x:5,y:8},destination:{x:388,y:565},shape:{origin:{x:150,y:250},move(p,{snap=false}={}){this.origin=snap?{x:Math.round(p.x/100)*100,y:Math.round(p.y/100)*100}:p;}}}};
  tile._onDragLeftMove(event);near(preview.document.x,390);near(preview.document.y,550);near(d.x,150);near(d.y,250);
  const update=tile._prepareDragLeftDropUpdates(event)[0];near(update.x,390);near(update.y,550);assert.equal(update._id,d.id);
  // Alt pressed at release must undo the snapped preview, not save its last position.
  event.altKey=true;const free=tile._prepareDragLeftDropUpdates(event)[0];near(free.x,383);near(free.y,557);
  event.altKey=false;event.shiftKey=true;tile._onDragLeftMove(event);near(preview.document.x,390);
  assert.equal(tile._onDragLeftCancel(event),'cancel');near(d.x,150);
  event.shiftKey=false;
  for(const change of [()=>{d.locked=true;},()=>{d.flags={};},()=>{canvas.tiles.controlled=[tile,{}];},()=>{game.user.isGM=false;},()=>{d.levels=['other'];}]){
    d.locked=false;d.flags={[ID]:{}};d.levels=['ground'];canvas.tiles.controlled=[tile];game.user.isGM=true;change();
    tile._onDragLeftMove(event);const ordinary=tile._prepareDragLeftDropUpdates(event)[0];near(ordinary.x,400);near(ordinary.y,600);
  }
});

test('styling preserves native hit area through selection, preview and release',()=>{
  globalThis.game={user:{isGM:true}};
  const frame={renderable:true,eventMode:'auto',hitArea:{contains:()=>true}};
  const border={renderable:true,eventMode:'auto'},handles={renderable:true,eventMode:'static'},icon={renderable:true,eventMode:'static'};
  const object={document:doc(),controlled:true,frame,controls:{border,handles},controlIcon:icon};
  const hitArea=frame.hitArea;
  for(const state of [{controlled:true,isPreview:false},{controlled:false,isPreview:true},{controlled:true,isPreview:false}]){
    Object.assign(object,state);styleTile(object);styleTile(object);
    assert.equal(frame.renderable,true);assert.equal(frame.eventMode,'auto');assert.equal(frame.hitArea,hitArea);
    for(const part of [border,handles,icon]){assert.equal(part.renderable,false);assert.equal(part.eventMode,'none');}
  }
  object.controlled=false;object.isPreview=false;styleTile(object);
  assert.equal(border.renderable,true);assert.equal(border.eventMode,'auto');assert.equal(handles.eventMode,'static');assert.equal(icon.eventMode,'static');
  object.document.flags={};object.controlled=true;styleTile(object);assert.equal(border.renderable,true);assert.equal(frame.eventMode,'auto');
  object.document.flags={[ID]:{}};game.user.isGM=false;styleTile(object);assert.equal(border.renderable,true);
});

test('selection corners leave edges open and track rotation, visible bounds and screen zoom',()=>{
  const d=doc({x:100,y:200,width:100,height:60});
  const g=selectionGeometry(d,new Map(),1);assert.equal(g.corners.length,4);near(g.width,1.5);
  assert.deepEqual(g.corners[0],[{x:58,y:170},{x:50,y:170},{x:50,y:178}]);
  const rotated=selectionGeometry(doc({...d,rotation:90}),new Map(),1);near(rotated.corners[0][1].x,130);near(rotated.corners[0][1].y,150);
  const zoomed=selectionGeometry(d,new Map(),2);near(zoomed.width*2,1.5);near(Math.hypot(zoomed.corners[0][0].x-zoomed.corners[0][1].x,zoomed.corners[0][0].y-zoomed.corners[0][1].y)*2,8);
  const dot=selectionGeometry(d,new Map(),.25);assert.deepEqual(dot.point,{x:100,y:200});near(dot.radius*.25,2.5);
  const asset={pixelWidth:100,pixelHeight:60,alphaBounds:[40,0,60,60]};
  const narrow=selectionGeometry(doc({...d,flags:{[ID]:{key:'curb'}}}),new Map([['curb',asset]]),1);assert.deepEqual(narrow.point,{x:100,y:200});
  assert.equal(selectionGeometry(d,new Map(),0),null);
});
