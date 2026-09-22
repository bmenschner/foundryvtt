import test from 'node:test';
import assert from 'node:assert/strict';
import {stackedTile,stackUpdate,overlaps} from '../modules/shadowrun-sprawlbuilder/stacking.mjs';
const ID='shadowrun-sprawlbuilder';
const tile=(id,x=0,y=0,width=100,height=100,extra={})=>({id,x,y,width,height,rotation:0,elevation:0,texture:{anchorX:0,anchorY:0},levels:['ground'],flags:{[ID]:{key:id}},...extra});
const stack=(t,others,options)=>stackedTile(t,others,'ground',options);
test('street and sidewalk are zero; curb, lid and arrow one; car two; arbitrary names use same rule',()=>{
  const street=stack(tile('street'),[]),walk=stack(tile('walk',100),[street]);assert.equal(street.sort,0);assert.equal(walk.sort,0);
  for(const key of ['curb','lid','arrow','arbitrary'])assert.equal(stack(tile(key,20,20,30,30),[street]).sort,1);
  const arrow=stack(tile('arrow',20,20,50,50),[street]);
  const car=stack(tile('car',30,30,20,20),[street,arrow]);assert.equal(car.sort,2);
  assert.equal(stack(tile('lid',120,20,20,20),[street,walk]).sort,1);
  assert.equal(stack(tile('free',500),[street,arrow,car]).sort,0);
});
test('edge and corner contact do not stack; rotated separating axes and transparent margins count',()=>{
  const street=tile('street');assert.equal(stack(tile('edge',100),[street]).sort,0);assert.equal(stack(tile('corner',100,100),[street]).sort,0);
  const rect={x:0,y:0,width:100,height:10,rotation:45};
  assert.equal(overlaps(rect,{...rect,x:0,y:30}),false);assert.equal(overlaps(rect,{...rect,x:1,y:1}),true);
  const assets=new Map([['trim',{pixelWidth:100,pixelHeight:100,alphaBounds:[40,40,60,60]}]]);
  assert.equal(stack(tile('trim',70),[street],{assets}).sort,0);
  assert.equal(stack(tile('trim',50),[street],{assets}).sort,1);
});
test('highest relevant sort wins while hidden, other levels/heights and self are excluded',()=>{
  const current=tile('moving',0,0,100,100,{sort:50});
  const irrelevant=[current,tile('hidden',0,0,100,100,{hidden:true,sort:80}),tile('floor2',0,0,100,100,{levels:['up'],sort:90}),tile('high',0,0,100,100,{elevation:3,sort:100}),tile('invisible',0,0,100,100,{alpha:0,sort:200})];
  assert.equal(stack(current,irrelevant).sort,0);
  assert.equal(stack(current,[...irrelevant,tile('legacy',0,0,100,100,{sort:-99999})]).sort,1);
  const older=tile('older',0,0,100,100,{sort:12});assert.equal(stack(current,[older]).sort,13);assert.equal(older.sort,12);
});
test('manual step persists, moving away drops auto to zero, and elevation/flags are preserved',()=>{
  const base=tile('road');const manual=stack(tile('prop'),[base],{mode:{automatic:false,step:7}});
  assert.equal(manual.sort,7);assert.equal(stack(manual,[]).sort,7);
  const doc=tile('auto',0,0,30,30,{elevation:4});doc.toObject=()=>({...doc});
  const update=stackUpdate(doc,{x:500,y:500},[base],'ground');assert.equal(update.sort,0);assert.equal(update.elevation,undefined);assert.equal(doc.elevation,4);
  assert.deepEqual(update[`flags.${ID}.stack`],{automatic:true,step:0});
  for(const step of [-1,1.5,NaN,Infinity])assert.throws(()=>stack(doc,[],{mode:{automatic:false,step}}));
  assert.equal(manual.flags[ID].key,'prop');assert.equal(base.sort,undefined);
});
test('batch neighbours independently use the existing support without staircase effects',()=>{
  const support=tile('road',0,0,300,100,{sort:0});const parts=[tile('a'),tile('b',100),tile('c',200)];
  assert.deepEqual(parts.map(t=>stack(t,[support]).sort),[1,1,1]);
});
