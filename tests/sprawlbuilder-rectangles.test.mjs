import test from 'node:test';
import assert from 'node:assert/strict';
import {rectangleBounds,stampCells} from '../modules/shadowrun-sprawlbuilder/stamps.mjs';

test('rectangle covers the same start/end cells in every drag direction and at fractional metre scales',()=>{
  for(const ppm of [100,125/1.524]){
    const rect={x:37.25,y:69.5,width:ppm*10,height:ppm*8};
    const point=(x,y)=>({x:rect.x+x*ppm,y:rect.y+y*ppm});
    for(const [a,b] of [[[1.2,2.7],[4.6,5.3]],[[4.6,5.3],[1.2,2.7]],[[1.2,5.3],[4.6,2.7]],[[4.6,2.7],[1.2,5.3]]]){
      const bounds=rectangleBounds(point(...a),point(...b),ppm,rect);
      const expected={x:rect.x+ppm,y:rect.y+2*ppm,width:4*ppm,height:4*ppm};
      assert.deepEqual(bounds,expected);
      const adjacent=[point(.5,2.5),point(5.5,2.5),point(1.5,1.5),point(1.5,6.5)].map(p=>stampCells([p],ppm,rect)[0]);
      assert(Math.abs(adjacent[0].x+ppm-bounds.x)<1e-8);assert(Math.abs(bounds.x+bounds.width-adjacent[1].x)<1e-8);
      assert(Math.abs(adjacent[2].y+ppm-bounds.y)<1e-8);assert(Math.abs(bounds.y+bounds.height-adjacent[3].y)<1e-8);
    }
  }
});

test('single clicks and exact boundary endpoints use the same cell as the stamp cursor',()=>{
  const rect={x:50,y:70,width:1000,height:800};
  for(const p of [{x:55,y:75},{x:150,y:170}])assert.deepEqual(rectangleBounds(p,p,100,rect),stampCells([p],100,rect)[0]);
  assert.deepEqual(rectangleBounds({x:55,y:75},{x:150,y:170},100,rect),{x:50,y:70,width:200,height:200});
});

test('rectangles clip to complete scene cells and reject selections entirely outside or within a partial edge',()=>{
  const rect={x:50,y:70,width:1050,height:850};
  assert.deepEqual(rectangleBounds({x:-100,y:-100},{x:1200,y:1000},100,rect),{x:50,y:70,width:1000,height:800});
  assert.throws(()=>rectangleBounds({x:1060,y:100},{x:1099,y:300},100,rect),/vollständige/);
  assert.throws(()=>rectangleBounds({x:-200,y:-100},{x:-10,y:-10},100,rect),/vollständige/);
  assert.throws(()=>rectangleBounds({x:NaN,y:0},{x:100,y:100},100,rect));
});
