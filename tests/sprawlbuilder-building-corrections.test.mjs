import test from 'node:test';
import assert from 'node:assert/strict';
import {tileRectangle} from '../modules/shadowrun-sprawlbuilder/snapping.mjs';
import {roofOutline,balconyBounds,balconyOpening,parapetSegments} from '../modules/shadowrun-sprawlbuilder/buildings.mjs';

test('building footprint excludes padding after moving, scaling and rotation',()=>{
  const tile={x:500,y:600,width:880,height:980,rotation:0,texture:{anchorX:0,anchorY:0},flags:{'shadowrun-sprawlbuilder':{building:true,footprintUV:[140/880,140/980,740/880,840/980]}}};
  const near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-8,`${actual} ≈ ${expected}`);
  const a=tileRectangle(tile,new Map());near(a.width,600);near(a.height,700);near(a.x,940);near(a.y,1090);
  const b=tileRectangle({...tile,width:1760,height:1960,rotation:90},new Map());near(b.width,1200);near(b.height,1400);near(b.x,-480);near(b.y,1480);
  const legacy=tileRectangle({...tile,flags:{}},new Map());assert.equal(legacy.width,880);
});
test('each balcony has a one metre opening and no parapet across the doorway',()=>{
  for(const shape of ['rectangle','l'])for(const side of ['north','south','east','west']){
    const points=roofOutline(8,6,shape),deck=balconyBounds(points,side),opening=balconyOpening(deck),segments=parapetSegments(points,opening);
    assert.equal(Math.hypot(opening[1][0]-opening[0][0],opening[1][1]-opening[0][1]),1);
    const perimeter=edges=>edges.reduce((n,[a,b])=>n+Math.hypot(a[0]-b[0],a[1]-b[1]),0);
    assert.equal(perimeter(parapetSegments(points,null))-perimeter(segments),1);
  }
});
