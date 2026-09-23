import test from 'node:test';
import assert from 'node:assert/strict';
import {clampPosition,readPosition,savePosition,rememberApplication} from '../modules/shadowrun-sprawlbuilder/panels.mjs';

test('positions are bounded, isolated by user/world/tool and tolerate unavailable storage',()=>{
  assert.deepEqual(clampPosition({left:-500,top:5000},{width:260,height:500},{width:540,height:700}),{left:8,top:192});
  assert.deepEqual(clampPosition({left:500,top:500},{width:780,height:900},{width:400,height:500}),{left:8,top:8});
  const values=new Map();globalThis.localStorage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  globalThis.game={world:{id:'one'},user:{id:'gm'}};
  savePosition('terrain',{left:100,top:200});assert.deepEqual(readPosition('terrain'),{left:100,top:200});assert.equal(readPosition('asset-tool'),null);
  game.user.id='other';assert.equal(readPosition('terrain'),null);game.user.id='gm';game.world.id='two';assert.equal(readPosition('terrain'),null);
  globalThis.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(readPosition('terrain'),null);assert.doesNotThrow(()=>savePosition('terrain',{left:0,top:0}));
});

test('native gallery uses public position events, restores, resets, stays above painting and cleans up',()=>{
  const values=new Map(),events=new Map(),windowEvents=new Map();
  globalThis.localStorage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  globalThis.game={world:{id:'one'},user:{id:'gm'}};
  globalThis.innerWidth=1200;globalThis.innerHeight=900;
  globalThis.window={addEventListener:(k,fn)=>windowEvents.set(k,fn),removeEventListener:k=>windowEvents.delete(k)};
  globalThis.getComputedStyle=()=>({zIndex:'10'});
  savePosition('assets',{left:100,top:120});
  const app={position:{left:0,top:0},element:{getBoundingClientRect:()=>({width:780,height:700})},bringToFront(){this.front=true;},
    setPosition(p){Object.assign(this.position,p);events.get('position')?.();},addEventListener:(k,fn)=>events.set(k,fn),removeEventListener:k=>events.delete(k)};
  const binding=rememberApplication(app);assert.equal(app.front,true);assert.deepEqual(app.position,{left:100,top:120,zIndex:51});
  app.setPosition({left:180,top:140});assert.deepEqual(readPosition('assets'),{left:180,top:140});
  binding.reset();assert.deepEqual(readPosition('assets'),{left:210,top:80});
  innerWidth=500;windowEvents.get('resize')();assert.equal(app.position.left,8);
  binding.dispose();assert.equal(events.size,0);assert.equal(windowEvents.size,0);
});
