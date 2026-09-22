import test from 'node:test';
import assert from 'node:assert/strict';
import {tileRectangle,snapTargets,snapToEdges} from '../modules/shadowrun-sprawlbuilder/snapping.mjs';
import {assetStampData} from '../modules/shadowrun-sprawlbuilder/rows.mjs';
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const target={id:'pavement',x:500,y:500,width:400,height:400,rotation:0};
const args={width:100,height:20,rotation:90,targets:[target],point:{x:282,y:500}};
test('curb snaps flush to pavement, slides along it and aligns ends',()=>{
  const result=snapToEdges(args);near(result.point.x,290);near(result.point.y,500);assert.equal(result.match.key,'pavement:2');
  const slide=snapToEdges({...args,point:{x:287,y:550},previous:result.match.key});near(slide.point.y,550);
  const end=snapToEdges({...args,point:{x:285,y:356}});near(end.point.y,350);
});
test('snap distances remain constant on screen; hysteresis releases at twenty pixels',()=>{
  assert.equal(snapToEdges({...args,point:{x:275,y:500}}).match,null);
  assert(snapToEdges({...args,point:{x:275,y:500},previous:'pavement:2'}).match);
  assert.equal(snapToEdges({...args,point:{x:269,y:500},previous:'pavement:2'}).match,null);
  assert.equal(snapToEdges({...args,zoom:2}).match,null);
  assert(snapToEdges({...args,point:{x:285,y:500},zoom:2}).match);
});
test('rotated targets produce parallel placement and a rotated highlighted edge',()=>{
  const a=Math.PI/6,c=Math.cos(a),s=Math.sin(a),p={x:500+c*(-218),y:500+s*(-218)};
  const r=snapToEdges({...args,point:p,rotation:120,targets:[{...target,rotation:30}]});
  near(r.point.x,500-210*c);near(r.point.y,500-210*s);assert.equal(r.rotation,120);assert(r.match);
});
test('known alpha margins and anchors produce visible bounds; other levels and hidden tiles are excluded',()=>{
  const asset={key:'example',pixelWidth:400,pixelHeight:200,alphaBounds:[50,20,350,180]};
  const assets=new Map([['example',asset]]),tile={id:'a',x:100,y:100,width:400,height:200,rotation:90,texture:{anchorX:0,anchorY:0},flags:{'shadowrun-sprawlbuilder':{key:'example'}},levels:['ground']};
  const r=tileRectangle(tile,assets);near(r.x,0);near(r.y,300);near(r.width,300);near(r.height,160);
  assert.equal(snapTargets([tile,{...tile,hidden:true},{...tile,levels:['upper']}],assets,'ground').length,1);
  const painted=tileRectangle({...tile,flags:{'shadowrun-sprawlbuilder':{key:'example',painted:true}}},assets);near(painted.width,400);
});
test('rotated stamp saves its visible centre at snapped point without distorting alpha bounds',()=>{
  const asset={key:'curb',name:'Curb',file:'assets/strassen/curb.webp',widthMeters:1,pixelWidth:200,pixelHeight:100,alphaBounds:[20,10,120,30]};
  const tile=assetStampData(asset,{grid:{size:100,distance:1,units:'m'},rect:{x:0,y:0,width:2000,height:2000},level:{id:'ground'},point:{x:290,y:500},rotation:90});
  const r=tileRectangle(tile,new Map([['curb',asset]]));near(r.x,290);near(r.y,500);near(r.width,100);near(r.height,20);
});
